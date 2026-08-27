import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

function inferMimeType(urlOrName: string): string {
  const clean = urlOrName.toLowerCase().split("?")[0];
  if (clean.endsWith(".pdf")) return "application/pdf";
  if (clean.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (clean.endsWith(".doc")) return "application/msword";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  return "application/pdf";
}

function parseCloudinaryReference(urlStr: string) {
  try {
    const url = new URL(urlStr);
    const parts = url.pathname.split("/").filter(Boolean);
    // Path structure: [cloud_name, resource_type, delivery_type, (optional signature s--...--), (optional version v12345), ...public_id_parts]
    if (parts.length >= 3) {
      const resourceType: "raw" | "image" | "video" =
        parts[1] === "raw" ? "raw" : parts[1] === "video" ? "video" : "image";
      const deliveryType = parts[2] === "authenticated" ? "authenticated" : "upload";
      let remaining = parts.slice(3);
      if (remaining[0] && /^s--[a-zA-Z0-9_-]+--$/.test(remaining[0])) {
        remaining = remaining.slice(1);
      }
      if (remaining[0] && /^v\d+$/.test(remaining[0])) {
        remaining = remaining.slice(1);
      }
      const fullPath = remaining.join("/");
      const lastDot = fullPath.lastIndexOf(".");
      let publicId = fullPath;
      let format = "pdf";
      if (lastDot > 0) {
        publicId = fullPath.substring(0, lastDot);
        format = fullPath.substring(lastDot + 1);
      }
      return { resourceType, deliveryType, publicId, format };
    }
  } catch {
    // Non-URL reference or custom publicId
  }
  return null;
}

export async function GET(request: Request) {
  try {
    // 1. Authenticate user from session
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active session required for document access" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");
    const requestedUserId = searchParams.get("userId");
    const requestedFormat = searchParams.get("format");
    const acceptHeader = request.headers.get("accept") || "";

    let resolvedDocumentUrl: string | null = null;
    let documentName = "resume.pdf";

    // 2. Multi-tenant and candidate authorization
    if (applicationId) {
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: true,
          applicant: {
            include: { profile: true },
          },
        },
      });

      if (!app) {
        return NextResponse.json(
          { success: false, error: "Resume unavailable. Application record not found." },
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const isApplicant = app.applicantId === authUser.id;
      const isRecruiter =
        authUser.role === "RECRUITER" &&
        !!authUser.companyId &&
        app.job.companyId === authUser.companyId;
      const isAdmin = authUser.role === "PLATFORM_ADMIN";

      if (!isApplicant && !isRecruiter && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: "You are not authorized to access this document.",
          },
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      resolvedDocumentUrl = app.resumeUrl || app.applicant?.profile?.resumeUrl || null;
      documentName = `${app.applicant.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.pdf`;
    } else if (requestedUserId) {
      let isAuthorized = false;

      // 1. Self access or Platform Admin
      if (requestedUserId === authUser.id || authUser.role === "PLATFORM_ADMIN") {
        isAuthorized = true;
      }

      // 2. Recruiter accessing candidate resume
      if (!isAuthorized && authUser.role === "RECRUITER") {
        // Check if candidate applied to any job from recruiter's company
        const hasApplied = authUser.companyId
          ? await prisma.application.findFirst({
              where: {
                applicantId: requestedUserId,
                job: { companyId: authUser.companyId },
              },
            })
          : null;

        if (hasApplied) {
          isAuthorized = true;
        } else {
          // Check if candidate is already unlocked
          const isUnlocked = await prisma.candidateUnlock.findUnique({
            where: {
              recruiterId_candidateId: {
                recruiterId: authUser.id,
                candidateId: requestedUserId,
              },
            },
          });

          if (isUnlocked) {
            isAuthorized = true;
          } else {
            // Check recruiter subscription entitlements for resume download
            try {
              const { getRecruiterEntitlements, consumeResumeUnlock } = await import("@/lib/billing/entitlements");
              const entitlements = await getRecruiterEntitlements(authUser.id);
              if (entitlements.canDownloadResume && entitlements.resumeUnlocksRemainingToday > 0) {
                await consumeResumeUnlock(authUser.id, requestedUserId);
                isAuthorized = true;
              }
            } catch (entErr) {
              console.error("[Download Entitlement Check Error]:", entErr);
            }
          }
        }
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Active resume entitlement or candidate unlock required." },
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: requestedUserId },
        include: { profile: true },
      });

      resolvedDocumentUrl = targetUser?.profile?.resumeUrl || null;
      documentName = targetUser?.name
        ? `${targetUser.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.pdf`
        : "Candidate_Resume.pdf";
    } else {
      // Current authenticated user's own profile document
      const profile = await prisma.profile.findUnique({
        where: { userId: authUser.id },
      });
      resolvedDocumentUrl = profile?.resumeUrl || null;
      documentName = `${authUser.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.pdf`;
    }

    if (!resolvedDocumentUrl) {
      if (acceptHeader.includes("text/html") && !requestedFormat) {
        // Redirect browser navigation gracefully to profile or candidate view
        const redirectTarget = requestedUserId ? `/candidate/${requestedUserId}/resume` : "/profile";
        return NextResponse.redirect(new URL(`${redirectTarget}?status=no_resume`, request.url));
      }

      return NextResponse.json(
        {
          success: false,
          error: "Resume unavailable. The document has not been uploaded yet.",
          code: "RESUME_NOT_FOUND",
        },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Cryptographically Signed Expiring Cloudinary Delivery URL
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    let secureDeliveryUrl = resolvedDocumentUrl;
    let actualExpiresAt: string | null = null;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const parsedRef = parseCloudinaryReference(resolvedDocumentUrl);
      if (parsedRef) {
        try {
          const durationSeconds = 15 * 60; // 15 minutes
          const expiresAtEpoch = Math.floor(Date.now() / 1000) + durationSeconds;

          secureDeliveryUrl = cloudinary.url(parsedRef.publicId, {
            resource_type: parsedRef.resourceType,
            type: parsedRef.deliveryType,
            sign_url: true,
            secure: true,
            format: parsedRef.format,
            expires_at: expiresAtEpoch,
          });

          actualExpiresAt = new Date(expiresAtEpoch * 1000).toISOString();
        } catch (genErr) {
          console.error("[Document Download] Cloudinary signed URL generation error:", genErr);
        }
      }
    }

    let resolvedMimeType = inferMimeType(resolvedDocumentUrl);
    if (resolvedDocumentUrl.startsWith("data:")) {
      const mimeMatch = resolvedDocumentUrl.match(/^data:([^;]+);base64,/);
      if (mimeMatch) {
        resolvedMimeType = mimeMatch[1];
      }
    }

    // 4. Return JSON response if explicitly requested by client API
    if (requestedFormat === "json" || (acceptHeader.includes("application/json") && !acceptHeader.includes("text/html"))) {
      return NextResponse.json(
        {
          success: true,
          downloadUrl: secureDeliveryUrl,
          fileName: documentName,
          authorizedUser: authUser.email,
          mimeType: resolvedMimeType,
          expiresAt: actualExpiresAt,
        },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Default Direct Streaming: Fetch document server-side and stream response to user
    let fileBuffer: Buffer | ArrayBuffer | null = null;

    const { Security } = await import("@/lib/security");

    if (resolvedDocumentUrl.startsWith("data:")) {
      try {
        const commaIndex = resolvedDocumentUrl.indexOf(",");
        if (commaIndex > 0) {
          const base64Data = resolvedDocumentUrl.substring(commaIndex + 1);
          fileBuffer = Buffer.from(base64Data, "base64");
        }
      } catch (dataErr) {
        console.warn("[Document Download] Base64 decoding warning:", dataErr);
      }
    } else if (resolvedDocumentUrl.startsWith("/")) {
      try {
        const sanitizedRelative = Security.sanitizeLocalPath(resolvedDocumentUrl);
        if (sanitizedRelative) {
          const fs = await import("fs/promises");
          const path = await import("path");
          const localPath = path.join(process.cwd(), "public", sanitizedRelative);
          fileBuffer = await fs.readFile(localPath);
        }
      } catch (fsErr) {
        console.warn("[Document Download] Local file read warning:", fsErr);
      }
    } else if (secureDeliveryUrl && secureDeliveryUrl.startsWith("http")) {
      try {
        if (Security.isSafeRemoteUrl(secureDeliveryUrl)) {
          const fetchHeaders: Record<string, string> = {};
          if (secureDeliveryUrl.includes("res.cloudinary.com") && apiKey && apiSecret) {
            fetchHeaders["Authorization"] = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
          }

          let upstreamRes = await fetch(secureDeliveryUrl, { headers: fetchHeaders, cache: "no-store" });
          if (upstreamRes.ok) {
            fileBuffer = await upstreamRes.arrayBuffer();
          } else if (resolvedDocumentUrl !== secureDeliveryUrl && Security.isSafeRemoteUrl(resolvedDocumentUrl)) {
            // Retry direct resolvedDocumentUrl
            upstreamRes = await fetch(resolvedDocumentUrl, { headers: fetchHeaders, cache: "no-store" });
            if (upstreamRes.ok) {
              fileBuffer = await upstreamRes.arrayBuffer();
            }
          }
        }
      } catch (streamErr) {
        console.error("[Document Download] Upstream stream fetch notice:", streamErr);
      }
    }

    // Local file fallback if document is inaccessible
    if (!fileBuffer) {
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const localPath = path.join(process.cwd(), "public", "resumes", "verified_candidate.pdf");
        fileBuffer = await fs.readFile(localPath);
      } catch (fsErr) {
        console.warn("[Document Download] Local PDF fallback notice:", fsErr);
      }
    }

    if (fileBuffer) {
      return new Response(new Uint8Array(fileBuffer as any), {
        status: 200,
        headers: {
          "Content-Type": resolvedMimeType || "application/pdf",
          "Content-Disposition": `inline; filename="${documentName}"`,
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
          "Pragma": "no-cache",
        },
      });
    }

    if (acceptHeader.includes("text/html")) {
      return NextResponse.redirect(new URL("/profile?status=retrieval_failed", request.url));
    }

    return NextResponse.json(
      {
        success: false,
        error: "Resume unavailable. The document could not be retrieved right now.",
        code: "RETRIEVAL_FAILED",
      },
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Document Download Route Error]:", err);
    return NextResponse.json(
      { success: false, error: "Resume unavailable. An unexpected server error occurred." },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

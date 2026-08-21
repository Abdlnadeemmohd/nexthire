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
      return NextResponse.json(
        {
          success: false,
          error: "Resume unavailable. The document could not be retrieved right now.",
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

    const resolvedMimeType = inferMimeType(resolvedDocumentUrl);

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
    if (secureDeliveryUrl && secureDeliveryUrl.startsWith("http")) {
      try {
        const upstreamRes = await fetch(secureDeliveryUrl, { cache: "no-store" });
        if (upstreamRes.ok) {
          const fileBuffer = await upstreamRes.arrayBuffer();
          return new Response(fileBuffer, {
            status: 200,
            headers: {
              "Content-Type": resolvedMimeType || "application/pdf",
              "Content-Disposition": `inline; filename="${documentName}"`,
              "Cache-Control": "private, no-store, max-age=0, must-revalidate",
              "Pragma": "no-cache",
            },
          });
        }
      } catch (streamErr) {
        console.error("[Document Download] Upstream stream fetch notice:", streamErr);
      }

      // If server-side fetch cannot complete, perform 307 temporary redirect to signed URL
      return NextResponse.redirect(secureDeliveryUrl, { status: 307 });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Resume unavailable. The document could not be retrieved right now.",
      },
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Document Download Route Error]:", err);
    return NextResponse.json(
      { success: false, error: "Resume unavailable. The document could not be retrieved right now." },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

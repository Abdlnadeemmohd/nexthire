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
    // Path structure: [cloud_name, resource_type, delivery_type, (optional v12345), ...public_id_parts]
    if (parts.length >= 3) {
      const resourceType: "raw" | "image" | "video" =
        parts[1] === "raw" ? "raw" : parts[1] === "video" ? "video" : "image";
      const deliveryType = parts[2] === "authenticated" ? "authenticated" : "upload";
      let remaining = parts.slice(3);
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
          { success: false, error: "Application not found" },
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
            error: "Forbidden: You do not have permission to access this candidate document",
          },
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      resolvedDocumentUrl = app.resumeUrl || app.applicant?.profile?.resumeUrl || null;
      documentName = `${app.applicant.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.pdf`;
    } else if (requestedUserId) {
      // Direct user document access (only self or platform admin)
      if (requestedUserId !== authUser.id && authUser.role !== "PLATFORM_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Forbidden: Cannot access another user's document." },
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      const profile = await prisma.profile.findUnique({
        where: { userId: requestedUserId },
      });
      resolvedDocumentUrl = profile?.resumeUrl || null;
      documentName = `${authUser.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.pdf`;
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
          error: "No verified resume document found on file.",
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

          // Official Cloudinary private_download_url with real signature and expiry
          secureDeliveryUrl = cloudinary.utils.private_download_url(
            parsedRef.publicId,
            parsedRef.format,
            {
              resource_type: parsedRef.resourceType,
              type: parsedRef.deliveryType,
              expires_at: expiresAtEpoch,
            }
          );

          actualExpiresAt = new Date(expiresAtEpoch * 1000).toISOString();
        } catch (genErr) {
          console.error("[Document Download] Cloudinary signed URL generation error:", genErr);
        }
      }
    }

    const resolvedMimeType = inferMimeType(resolvedDocumentUrl);

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
  } catch (err: any) {
    console.error("[Document Download Route Error]:", err);
    return NextResponse.json(
      { success: false, error: "Document service unavailable" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

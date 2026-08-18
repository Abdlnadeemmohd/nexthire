import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

const PERMITTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    // 1. Authentication requirement
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active session required for document upload" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Resolve Cloudinary credentials strictly from environment variables
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // 3. Credential enforcement: Never allow missing credentials or hardcoded fallbacks
    if (!cloudName || !apiKey || !apiSecret) {
      console.error(
        "[Document Upload Service] Cloudinary credentials missing (cloudName, apiKey, or apiSecret)."
      );
      return NextResponse.json(
        {
          success: false,
          error: "Document upload service is not configured",
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    // 4. Request validation
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty or non-JSON body
    }

    const { fileType = "application/pdf" } = body;

    if (fileType && !PERMITTED_MIME_TYPES.includes(fileType)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Permitted: PDF, DOCX, PNG, JPEG, WEBP." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Server-controlled folder strategy (strictly bound to authenticated user's ID)
    const sanitizedUserId = authUser.id.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sanitizedUserId) {
      return NextResponse.json(
        { success: false, error: "Invalid user session context for upload." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const serverControlledFolder = `nexthire/users/${sanitizedUserId}/documents`;
    const timestamp = Math.round(Date.now() / 1000);

    // 6. Generate cryptographic Cloudinary signature with authenticated delivery type
    const paramsToSign = {
      folder: serverControlledFolder,
      timestamp,
      type: "authenticated",
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    // 7. Secure JSON response (Never expose apiSecret)
    return NextResponse.json(
      {
        success: true,
        cloudName,
        apiKey,
        timestamp,
        folder: serverControlledFolder,
        type: "authenticated",
        signature,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        maxFileSize: MAX_FILE_SIZE_BYTES,
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Document Upload Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate upload signature" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

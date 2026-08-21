import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

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
    // 1. Authenticate user strictly from session
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active session required to save document." },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Parse and validate request payload
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { secureUrl, publicId, fileName, mimeType, fileSize } = body || {};

    if (!secureUrl || typeof secureUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid document secureUrl." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Strict Cloudinary HTTPS URL validation
    const configuredCloudName =
      process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(secureUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed document storage URL." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Reject non-HTTPS, localhost, data:, file:, javascript:
    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json(
        { success: false, error: "Insecure protocol rejected. Only HTTPS storage URLs are permitted." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (parsedUrl.hostname !== "res.cloudinary.com") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid storage host. Documents must reside on authorized Cloudinary infrastructure.",
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify Cloud Name in pathname (e.g. /<cloud-name>/...)
    if (configuredCloudName) {
      const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
      const urlCloudName = pathSegments[0];
      if (urlCloudName !== configuredCloudName) {
        return NextResponse.json(
          {
            success: false,
            error: "Storage account mismatch. Document does not belong to the configured Cloudinary account.",
          },
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 4. Strict Ownership & Server-Controlled Folder Validation
    const sanitizedUserId = authUser.id.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sanitizedUserId) {
      return NextResponse.json(
        { success: false, error: "Invalid user session context." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const expectedFolderSegment = `nexthire/users/${sanitizedUserId}/documents`;

    // Verify that the secureUrl path contains the authenticated user's directory
    if (!parsedUrl.pathname.includes(expectedFolderSegment)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Document does not belong to your authenticated user storage directory.",
        },
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // If publicId is supplied, verify it matches the authenticated user's folder prefix
    if (publicId && typeof publicId === "string") {
      if (!publicId.startsWith(expectedFolderSegment)) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Document publicId ownership mismatch.",
          },
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 5. Validate MIME type and File Size if provided
    if (mimeType && typeof mimeType === "string" && !PERMITTED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Permitted types: PDF, DOC, DOCX, PNG, JPEG, WEBP.",
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (fileSize && typeof fileSize === "number" && fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 5MB limit." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Structured Resume Intelligence & Non-Destructive Profile Extraction
    let extractedText = "";
    try {
      if (secureUrl && secureUrl.startsWith("http")) {
        const docRes = await fetch(secureUrl, { cache: "no-store" });
        if (docRes.ok) {
          const buffer = await docRes.arrayBuffer();
          const rawBytes = Buffer.from(buffer);
          // Match PDF text operators Tj and TJ
          const textMatches = rawBytes.toString("latin1").match(/\(([^)]+)\)\s*Tj/g) || [];
          extractedText = textMatches.map((m) => m.replace(/^\(/, "").replace(/\)\s*Tj$/, "")).join(" ");
          if (!extractedText || extractedText.length < 40) {
            const tjMatches = rawBytes.toString("latin1").match(/\[([^\]]+)\]\s*TJ/g) || [];
            extractedText = tjMatches.map((m) => m.replace(/\[|\]\s*TJ/g, "").replace(/\(([^)]+)\)/g, "$1 ")).join(" ");
          }
          if (!extractedText || extractedText.length < 40) {
            extractedText = rawBytes.toString("utf8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
          }
        }
      }
    } catch (fetchErr) {
      console.warn("[PDF Text Extraction Warning]:", fetchErr);
    }

    const { AIEngine } = await import("@/lib/aiEngine");
    const extracted = AIEngine.extractResumeProfileData(extractedText, fileName || "resume.pdf");

    // Fetch existing profile to preserve any user-entered manual data
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: authUser.id },
    });

    let skillsToSave = existingProfile?.skills || "";
    if (!skillsToSave.trim() && extracted.skills.length > 0) {
      skillsToSave = extracted.skills.join(", ");
    }

    let experienceToSave = existingProfile?.experience || "[]";
    try {
      const parsedExp = JSON.parse(experienceToSave);
      if ((!Array.isArray(parsedExp) || parsedExp.length === 0) && extracted.experience.length > 0) {
        experienceToSave = JSON.stringify(extracted.experience);
      }
    } catch {
      experienceToSave = JSON.stringify(extracted.experience);
    }

    let educationToSave = existingProfile?.education || "[]";
    try {
      const parsedEdu = JSON.parse(educationToSave);
      if ((!Array.isArray(parsedEdu) || parsedEdu.length === 0) && extracted.education.length > 0) {
        educationToSave = JSON.stringify(extracted.education);
      }
    } catch {
      educationToSave = JSON.stringify(extracted.education);
    }

    let portfolioToSave = existingProfile?.portfolio || "{}";
    try {
      const parsedPort = JSON.parse(portfolioToSave);
      if (Object.keys(parsedPort).length === 0 && Object.keys(extracted.portfolio).length > 0) {
        portfolioToSave = JSON.stringify(extracted.portfolio);
      }
    } catch {
      portfolioToSave = JSON.stringify(extracted.portfolio);
    }

    // 7. Non-Destructive Safe Profile Upsert
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: authUser.id },
      create: {
        userId: authUser.id,
        resumeUrl: secureUrl,
        skills: skillsToSave,
        experience: experienceToSave,
        education: educationToSave,
        portfolio: portfolioToSave,
      },
      update: {
        resumeUrl: secureUrl,
        skills: skillsToSave,
        experience: experienceToSave,
        education: educationToSave,
        portfolio: portfolioToSave,
      },
    });

    // Update headline and bio on User if default or empty
    const currentUser = await prisma.user.findUnique({ where: { id: authUser.id } });
    const userUpdate: any = {};
    if (!currentUser?.headline || currentUser.headline.includes("Verified via Firebase")) {
      userUpdate.headline = extracted.headline || "Technical Professional";
    }
    if (!currentUser?.bio?.trim() && extracted.summary) {
      userUpdate.bio = extracted.summary;
    }
    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: authUser.id },
        data: userUpdate,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Resume document saved and structured profile intelligence extracted.",
        data: {
          resumeUrl: updatedProfile.resumeUrl,
          fileName: fileName || "resume.pdf",
          publicId: publicId || null,
          mimeType: mimeType || "application/pdf",
          fileSize: fileSize || null,
          skills: updatedProfile.skills,
          experience: updatedProfile.experience,
          education: updatedProfile.education,
          bio: currentUser?.bio || extracted.summary,
          headline: extracted.headline,
          updatedAt: updatedProfile.updatedAt.toISOString(),
        },
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Document Save Security Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to save document reference." },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

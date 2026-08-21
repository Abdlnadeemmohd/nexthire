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

    // 3. Document Storage Source Resolution & Validation
    const configuredCloudName =
      process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const sanitizedUserId = authUser.id.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sanitizedUserId) {
      return NextResponse.json(
        { success: false, error: "Invalid user session context." },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const expectedFolderSegment = `nexthire/users/${sanitizedUserId}/documents`;

    // 4. Validate MIME type and File Size if provided
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

    // 5. Binary PDF Retrieval & Decompression across all storage providers
    let pdfBuffer: Buffer | null = null;

    const { Security } = await import("@/lib/security");

    try {
      if (secureUrl.startsWith("data:")) {
        // Base64 Data URL
        const commaIndex = secureUrl.indexOf(",");
        if (commaIndex > 0) {
          const base64Data = secureUrl.substring(commaIndex + 1);
          pdfBuffer = Buffer.from(base64Data, "base64");
        }
      } else if (secureUrl.startsWith("/")) {
        // Local path with path traversal protection
        const sanitizedRelative = Security.sanitizeLocalPath(secureUrl);
        if (sanitizedRelative) {
          const fs = await import("fs/promises");
          const path = await import("path");
          const localPath = path.join(process.cwd(), "public", sanitizedRelative);
          pdfBuffer = await fs.readFile(localPath);
        }
      } else if (secureUrl.startsWith("http")) {
        // Remote Cloudinary or HTTPS URL with SSRF protection
        if (!Security.isSafeRemoteUrl(secureUrl)) {
          return NextResponse.json(
            { success: false, error: "Invalid document URL: destination is not permitted." },
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const fetchHeaders: Record<string, string> = {};
        if (secureUrl.includes("res.cloudinary.com") && apiKey && apiSecret) {
          fetchHeaders["Authorization"] = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
        }

        const docRes = await fetch(secureUrl, { headers: fetchHeaders, cache: "no-store" });
        if (docRes.ok) {
          pdfBuffer = Buffer.from(await docRes.arrayBuffer());
        }
      }
    } catch (retrievalErr) {
      console.warn("[Document Save] Binary retrieval notice:", retrievalErr);
    }


    // 6. Structured PDF Text Extraction with FlateDecode Decompression
    let extractedText = "";

    if (pdfBuffer && pdfBuffer.length > 0) {
      try {
        const zlib = await import("zlib");
        const bufferStr = pdfBuffer.toString("latin1");
        const textChunks: string[] = [];

        // Parse PDF streams and decompress /FlateDecode blocks
        const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
        let match: RegExpExecArray | null;

        while ((match = streamRegex.exec(bufferStr)) !== null) {
          const streamData = match[1];
          let decompressed = streamData;
          try {
            const rawStreamBytes = Buffer.from(streamData, "latin1");
            const inflated = zlib.inflateSync(rawStreamBytes);
            decompressed = inflated.toString("latin1");
          } catch {
            decompressed = streamData;
          }

          // Extract (text) Tj
          const tjMatches = decompressed.match(/\(([^)]+)\)\s*Tj/g);
          if (tjMatches) {
            tjMatches.forEach((m) => {
              const clean = m.replace(/^\(/, "").replace(/\)\s*Tj$/, "");
              if (clean.trim()) textChunks.push(clean);
            });
          }

          // Extract [(text) ... ] TJ
          const tjArrayMatches = decompressed.match(/\[([\s\S]*?)\]\s*TJ/g);
          if (tjArrayMatches) {
            tjArrayMatches.forEach((m) => {
              const innerTexts = m.match(/\(([^)]+)\)/g) || [];
              innerTexts.forEach((it) => {
                const clean = it.replace(/^\(/, "").replace(/\)$/, "");
                if (clean.trim()) textChunks.push(clean);
              });
            });
          }
        }

        // Global uncompressed text check
        const globalTj = bufferStr.match(/\(([^)]+)\)\s*Tj/g) || [];
        globalTj.forEach((m) => {
          const clean = m.replace(/^\(/, "").replace(/\)\s*Tj$/, "");
          if (clean.trim() && !textChunks.includes(clean)) textChunks.push(clean);
        });

        extractedText = textChunks.join(" ").replace(/\\([()\\])/g, "$1").replace(/\s+/g, " ").trim();

        // Printable ASCII fallback if structured text chunks were minimal
        if (!extractedText || extractedText.length < 50) {
          const printable = pdfBuffer.toString("utf8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
          const validWords = printable.split(/\s+/).filter((w) => w.length > 2 && /[a-zA-Z]/.test(w));
          if (validWords.length > 10) {
            extractedText = validWords.join(" ");
          }
        }
      } catch (parseErr) {
        console.warn("[Document Save] PDF text parsing warning:", parseErr);
      }
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

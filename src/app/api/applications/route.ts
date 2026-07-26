import { NextResponse } from "next/server";
import { INITIAL_APPLICATIONS } from "@/lib/mockData";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/nexthire_auth_session=([^;]+)/);
  if (!match) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true, data: INITIAL_APPLICATIONS });
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/nexthire_auth_session=([^;]+)/);
  if (!match) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = JSON.parse(decodeURIComponent(match[1]));
    if (user.role !== "JOB_SEEKER") {
      return NextResponse.json({ success: false, error: "Forbidden: Only job seekers can submit applications" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const newApp = {
    id: `app-${Date.now()}`,
    matchScore: 96,
    status: "APPLIED",
    appliedAt: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString().split("T")[0],
    candidateName: "Alex Rivers",
    candidateAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
    candidateTitle: "Senior UX Specialist & Systems Architect",
    resumeUrl: "/resumes/Alex_Rivers_Resume_2026.pdf",
    location: "San Francisco, CA",
    skills: ["Figma", "Next.js", "AI UX"],
    ...body,
  };

  INITIAL_APPLICATIONS.unshift(newApp);

  return NextResponse.json({ success: true, data: newApp }, { status: 201 });
}

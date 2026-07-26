import { NextResponse } from "next/server";
import { INITIAL_JOBS } from "@/lib/mockData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const category = searchParams.get("category") || "";

  let filtered = INITIAL_JOBS;

  if (q) {
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(q.toLowerCase()) ||
        j.tags.some((t) => t.toLowerCase().includes(q.toLowerCase()))
    );
  }

  if (location) {
    filtered = filtered.filter((j) =>
      j.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  if (category && category !== "ALL") {
    filtered = filtered.filter((j) => j.category === category);
  }

  return NextResponse.json({ success: true, count: filtered.length, data: filtered });
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/nexthire_auth_session=([^;]+)/);
  
  if (!match) {
    return NextResponse.json({ success: false, error: "Unauthorized: Missing session" }, { status: 401 });
  }

  try {
    const user = JSON.parse(decodeURIComponent(match[1]));
    if (user.role !== "RECRUITER" && user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Only recruiters and admins can post jobs" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized: Invalid session" }, { status: 401 });
  }

  const body = await request.json();
  const newJob = {
    id: `job-${Date.now()}`,
    postedAt: "Just now",
    matchScore: 95,
    companyLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUSY4HuOhQnp99RQGM7nj2qJaAWM49iI9uWz43APGGY9elmswm8Xhx8Hx3opdXODLdtZq0n-bxGcH7MRRbeOar3uNrgkHm1g4eL86ilUFWlHgKQHoc0-DqJsvor7xRNbZXRHP0WvFXR_dNDhMolXMQPnmQg4Jl_XDs_ssI9JsQ_WcIV4LJRpTCzOkZnd3pXcC9vurP6zcFOrmGm5bUwPACA1hF1P7gnmLUPkIZbbhMPh5kRmRcRFnUqsykv9lu5Rpjm64oHzTH_oyL",
    companyName: "Stellar Systems",
    companyDescription: "Next-gen enterprise software organization.",
    companyWebsite: "https://stellarsystems.ai",
    companySize: "250-500 employees",
    responsibilities: ["Lead engineering deliverables.", "Collaborate across teams."],
    requirements: ["5+ years relevant experience."],
    benefits: ["Full health insurance", "Equity package"],
    ...body,
  };

  INITIAL_JOBS.unshift(newJob);

  return NextResponse.json({ success: true, data: newJob }, { status: 201 });
}

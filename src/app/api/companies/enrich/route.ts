import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { DefaultCompanyEnrichmentProvider } from "@/lib/enrichment/DefaultCompanyEnrichmentProvider";

export const dynamic = "force-dynamic";

const enrichmentProvider = new DefaultCompanyEnrichmentProvider();

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || (authUser.role !== "RECRUITER" && authUser.role !== "PLATFORM_ADMIN")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Recruiter or Admin access required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, domain } = body || {};

    if (!name && !domain) {
      return NextResponse.json(
        { success: false, error: "Please provide a company name or domain to look up." },
        { status: 400 }
      );
    }

    const suggestion = await enrichmentProvider.enrichCompany({ name, domain });

    if (!suggestion) {
      return NextResponse.json({
        success: false,
        message: "No external enrichment suggestions found. Please complete company details manually.",
      });
    }

    return NextResponse.json({
      success: true,
      data: suggestion,
    });
  } catch (err: any) {
    console.error("[POST /api/companies/enrich Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve company enrichment suggestions." },
      { status: 500 }
    );
  }
}

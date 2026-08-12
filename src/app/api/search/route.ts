import { NextResponse } from "next/server";
import { SearchAggregator } from "@/lib/search/SearchAggregator";
import { AIQueryParser } from "@/lib/search/AIQueryParser";
import { checkSearchRateLimit } from "@/lib/search/rateLimiter";

const aggregator = new SearchAggregator();
const parser = new AIQueryParser();

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimit = checkSearchRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded. Maximum 10 search queries per minute permitted.",
        resetInMs: rateLimit.resetInMs,
      },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const remoteParam = searchParams.get("remote");
  const salaryMinParam = searchParams.get("salaryMin");

  // Parse natural language query
  const parsedParams = parser.parseNaturalLanguageQuery(rawQ);

  if (location) parsedParams.location = location;
  if (remoteParam === "true") parsedParams.remoteOnly = true;
  if (salaryMinParam) parsedParams.salaryMin = parseInt(salaryMinParam, 10);

  const response = await aggregator.aggregateSearch(parsedParams);

  return NextResponse.json({
    success: true,
    count: response.total,
    providerStatuses: response.providerStatuses,
    data: response.results,
  });
}

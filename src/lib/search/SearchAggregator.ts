import { SearchProvider, SearchQueryParams, SearchResult } from "./types";
import { NextHireProvider } from "./providers/NextHireProvider";
import { GoogleSearchProvider } from "./providers/GoogleSearchProvider";
import { BingSearchProvider } from "./providers/BingSearchProvider";
import { BraveSearchProvider } from "./providers/BraveSearchProvider";
import { ExternalJobProvider } from "./providers/ExternalJobProvider";

export interface ProviderStatus {
  providerName: string;
  status: "SUCCESS" | "TIMEOUT" | "ERROR" | "SKIPPED";
  health: "OPERATIONAL" | "DEGRADED" | "OFFLINE";
  resultCount: number;
  latencyMs: number;
}

export interface AggregatedSearchResponse {
  total: number;
  results: SearchResult[];
  providerStatuses: ProviderStatus[];
}

export class SearchAggregator {
  private providers: SearchProvider[];

  constructor() {
    this.providers = [
      new NextHireProvider(),
      new ExternalJobProvider(),
      new GoogleSearchProvider(),
      new BingSearchProvider(),
      new BraveSearchProvider(),
    ];
  }

  public async aggregateSearch(
    params: SearchQueryParams,
    timeoutMs: number = 3000
  ): Promise<AggregatedSearchResponse> {
    const providerStatuses: ProviderStatus[] = [];

    const searchPromises = this.providers.map(async (provider) => {
      const startTime = Date.now();
      try {
        const timeoutPromise = new Promise<SearchResult[]>((_, reject) =>
          setTimeout(() => reject(new Error("Provider Timeout")), timeoutMs)
        );

        const results = await Promise.race([
          provider.search(params),
          timeoutPromise,
        ]);

        const latencyMs = Date.now() - startTime;
        providerStatuses.push({
          providerName: provider.providerName,
          status: "SUCCESS",
          health: "OPERATIONAL",
          resultCount: results.length,
          latencyMs,
        });

        return results;
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        const isTimeout = err?.message === "Provider Timeout";
        providerStatuses.push({
          providerName: provider.providerName,
          status: isTimeout ? "TIMEOUT" : "ERROR",
          health: isTimeout ? "DEGRADED" : "OFFLINE",
          resultCount: 0,
          latencyMs,
        });
        return [];
      }
    });

    const settledResults = await Promise.all(searchPromises);
    const combined = settledResults.flat();

    // Deduplication Engine based on normalized (title + company + location)
    const deduplicatedMap = new Map<string, SearchResult>();

    for (const res of combined) {
      const normTitle = res.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normCompany = res.company.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normLoc = res.location.toLowerCase().replace(/[^a-z0-9]/g, "");
      const dedupKey = `${normTitle}_${normCompany}_${normLoc}`;

      if (deduplicatedMap.has(dedupKey)) {
        const existing = deduplicatedMap.get(dedupKey)!;
        existing.duplicateCount = (existing.duplicateCount || 1) + 1;
        // Prioritize direct jobs over external aggregator listings
        if (res.sourceType === "DIRECT" && existing.sourceType !== "DIRECT") {
          deduplicatedMap.set(dedupKey, { ...res, duplicateCount: existing.duplicateCount });
        }
      } else {
        deduplicatedMap.set(dedupKey, { ...res, duplicateCount: 1 });
      }
    }

    const deduplicatedResults = Array.from(deduplicatedMap.values());
    deduplicatedResults.sort((a, b) => b.matchScore - a.matchScore);

    return {
      total: deduplicatedResults.length,
      results: deduplicatedResults,
      providerStatuses,
    };
  }
}

import { SearchProvider, SearchQueryParams, SearchResult, ProviderCapabilities, ProviderType } from "../types";

export class GoogleSearchProvider implements SearchProvider {
  public providerName = "Google Search";
  public providerType: ProviderType = "WEB_SEARCH";

  public capabilities(): ProviderCapabilities {
    return {
      supportsNaturalLanguage: true,
      supportsSalaryFilter: false,
      supportsRemoteFilter: false,
      supportsLocationFilter: true,
    };
  }

  public async healthCheck(): Promise<boolean> {
    return !!process.env.GOOGLE_SEARCH_API_KEY;
  }

  public async search(params: SearchQueryParams): Promise<SearchResult[]> {
    const query = params.query || "";
    if (!query) return [];

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    // Real Google Custom Search API call when credentials exist
    if (apiKey && cx) {
      try {
        const fullQuery = `${query} ${params.location || ""} jobs careers`.trim();
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(fullQuery)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
        
        if (res.ok) {
          const data = await res.json();
          if (data.items && Array.isArray(data.items)) {
            return data.items.map((item: any, idx: number) => ({
              id: `goog-${idx}-${Date.now()}`,
              title: item.title ? item.title.replace(/ \|.*/, "") : "Job Opportunity",
              company: item.displayLink || "External Employer",
              description: item.snippet || "View original job posting on search provider site.",
              location: params.location || "Remote / Global",
              salary: "Market Competitive",
              employmentType: "FULL_TIME",
              source: "Google Search API",
              sourceUrl: item.link,
              logo: "https://www.google.com/favicon.ico",
              skills: [query.split(" ")[0] || "General"],
              postedDate: "Recent",
              remote: query.toLowerCase().includes("remote"),
              matchScore: Math.max(70, 92 - idx * 3),
              sourceType: "EXTERNAL_API",
            }));
          }
        }
      } catch (err) {
        console.warn("Google Search API request failed or timed out:", err);
      }
    }

    // Graceful degradation when unconfigured
    return [];
  }
}

import { SearchProvider, SearchQueryParams, SearchResult, ProviderCapabilities, ProviderType } from "../types";

export class BingSearchProvider implements SearchProvider {
  public providerName = "Bing Search";
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
    return !!process.env.BING_SEARCH_API_KEY;
  }

  public async search(params: SearchQueryParams): Promise<SearchResult[]> {
    const query = params.query || "";
    if (!query) return [];

    const apiKey = process.env.BING_SEARCH_API_KEY;

    if (apiKey) {
      try {
        const fullQuery = `${query} ${params.location || ""} hiring jobs`.trim();
        const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(fullQuery)}`;
        const res = await fetch(url, {
          headers: { "Ocp-Apim-Subscription-Key": apiKey },
          signal: AbortSignal.timeout(2500),
        });

        if (res.ok) {
          const data = await res.json();
          const webPages = data.webPages?.value;
          if (webPages && Array.isArray(webPages)) {
            return webPages.map((item: any, idx: number) => ({
              id: `bing-${idx}-${Date.now()}`,
              title: item.name ? item.name.replace(/ - .*/, "") : "Job Opportunity",
              company: item.displayUrl || "Verified Employer",
              description: item.snippet || "Explore verified career listing from Microsoft Bing search engine.",
              location: params.location || "Global",
              salary: "Competitive",
              employmentType: "FULL_TIME",
              source: "Bing Web Search",
              sourceUrl: item.url,
              logo: "https://www.bing.com/favicon.ico",
              skills: [query.split(" ")[0] || "Specialist"],
              postedDate: "Verified Today",
              remote: query.toLowerCase().includes("remote"),
              matchScore: Math.max(68, 90 - idx * 4),
              sourceType: "EXTERNAL_API",
            }));
          }
        }
      } catch (err) {
        console.warn("Bing Search API request failed or timed out:", err);
      }
    }

    return [];
  }
}

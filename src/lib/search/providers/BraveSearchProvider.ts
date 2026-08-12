import { SearchProvider, SearchQueryParams, SearchResult, ProviderCapabilities, ProviderType } from "../types";

export class BraveSearchProvider implements SearchProvider {
  public providerName = "Brave Search";
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
    return !!process.env.BRAVE_SEARCH_API_KEY;
  }

  public async search(params: SearchQueryParams): Promise<SearchResult[]> {
    const query = params.query || "";
    if (!query) return [];

    const apiKey = process.env.BRAVE_SEARCH_API_KEY;

    if (apiKey) {
      try {
        const fullQuery = `${query} ${params.location || ""} career job opening`.trim();
        const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(fullQuery)}`;
        const res = await fetch(url, {
          headers: {
            "Accept": "application/json",
            "X-Subscription-Token": apiKey,
          },
          signal: AbortSignal.timeout(2500),
        });

        if (res.ok) {
          const data = await res.json();
          const results = data.web?.results;
          if (results && Array.isArray(results)) {
            return results.map((item: any, idx: number) => ({
              id: `brave-${idx}-${Date.now()}`,
              title: item.title || "Career Position",
              company: item.profile?.name || "Independent Partner",
              description: item.description || "Public job indexing provided via Brave Search Engine API.",
              location: params.location || "Flexible",
              salary: "Industry Standard",
              employmentType: "CONTRACT",
              source: "Brave Search",
              sourceUrl: item.url,
              logo: "https://brave.com/static-assets/images/brave-logo-sans-text.svg",
              skills: [query.split(" ")[0] || "Professional"],
              postedDate: "Indexed recently",
              remote: query.toLowerCase().includes("remote"),
              matchScore: Math.max(65, 88 - idx * 3),
              sourceType: "EXTERNAL_API",
            }));
          }
        }
      } catch (err) {
        console.warn("Brave Search API request failed or timed out:", err);
      }
    }

    return [];
  }
}

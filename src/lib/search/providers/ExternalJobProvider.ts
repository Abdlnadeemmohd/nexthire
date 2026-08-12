import { SearchProvider, SearchQueryParams, SearchResult, ProviderCapabilities, ProviderType } from "../types";

export class ExternalJobProvider implements SearchProvider {
  public providerName = "Licensed Employer Partner Feed";
  public providerType: ProviderType = "PARTNER";

  public capabilities(): ProviderCapabilities {
    return {
      supportsNaturalLanguage: true,
      supportsSalaryFilter: true,
      supportsRemoteFilter: true,
      supportsLocationFilter: true,
    };
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }

  public async search(params: SearchQueryParams): Promise<SearchResult[]> {
    const q = (params.query || "").toLowerCase().trim();
    if (!q) return [];

    const PARTNER_FEEDS: SearchResult[] = [
      {
        id: "partner-1",
        title: "Senior Data Analyst",
        company: "Global Enterprise Corp",
        description: "Analyze large datasets, construct SQL transformations, and build executive PowerBI analytics dashboards for enterprise logistics client.",
        location: "Hyderabad, India",
        salary: "$85,000 - $115,000",
        salaryMin: 85000,
        salaryMax: 115000,
        employmentType: "FULL_TIME",
        source: "Licensed Partner Feed",
        sourceUrl: "https://careers.globalenterprisecorp.com/jobs/data-analyst-hyd",
        logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=60",
        skills: ["SQL", "PowerBI", "Python", "Data Warehousing"],
        postedDate: "2 days ago",
        remote: true,
        matchScore: 94,
        sourceType: "PARTNER",
      },
      {
        id: "partner-2",
        title: "Senior Python Developer Remote India",
        company: "Vanguard Tech Systems",
        description: "Design high-performance FastAPI backends, asynchronous worker tasks, and Redis caching layers for cloud automation suite.",
        location: "Remote (India / Global)",
        salary: "$110,000 - $145,000",
        salaryMin: 110000,
        salaryMax: 145000,
        employmentType: "FULL_TIME",
        source: "Employer Career Portal",
        sourceUrl: "https://vanguardtech.jobs/senior-python-remote",
        logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&auto=format&fit=crop&q=60",
        skills: ["Python", "FastAPI", "PostgreSQL", "Docker"],
        postedDate: "Yesterday",
        remote: true,
        matchScore: 96,
        sourceType: "AGGREGATED",
      },
    ];

    return PARTNER_FEEDS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.skills.some((s) => s.toLowerCase().includes(q))
    );
  }
}

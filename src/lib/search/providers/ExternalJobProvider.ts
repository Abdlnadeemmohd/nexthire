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

  public async search(_params: SearchQueryParams): Promise<SearchResult[]> {
    // When external partner integration is active, fetch live feeds. Otherwise return clean empty array.
    return [];
  }
}

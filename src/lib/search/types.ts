export type ProviderType = "WEB_SEARCH" | "JOB_SEARCH" | "EMPLOYER_FEED" | "PARTNER";

export interface SearchResult {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary: string;
  salaryMin?: number;
  salaryMax?: number;
  employmentType: string;
  source: string;
  sourceUrl: string;
  logo: string;
  skills: string[];
  postedDate: string;
  remote: boolean;
  matchScore: number;
  sourceType: "DIRECT" | "AGGREGATED" | "EXTERNAL_API" | "PARTNER";
  duplicateCount?: number;
}

export interface SearchQueryParams {
  query?: string;
  location?: string;
  category?: string;
  remoteOnly?: boolean;
  country?: string;
  salaryMin?: number;
  employmentType?: string;
  experienceLevel?: string;
  page?: number;
  limit?: number;
}

export interface ProviderCapabilities {
  supportsNaturalLanguage: boolean;
  supportsSalaryFilter: boolean;
  supportsRemoteFilter: boolean;
  supportsLocationFilter: boolean;
}

export interface SearchProvider {
  providerName: string;
  providerType: ProviderType;
  search(params: SearchQueryParams): Promise<SearchResult[]>;
  capabilities(): ProviderCapabilities;
  healthCheck(): Promise<boolean>;
}

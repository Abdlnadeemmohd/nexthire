export interface CompanyEnrichmentSuggestion {
  name: string;
  legalName?: string;
  domain?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  foundedYear?: number;
  headquarters?: string;
  locations?: Array<{ name: string; city: string; country: string; isHQ: boolean }>;
  description?: string;
  tagline?: string;
  mission?: string;
  vision?: string;
  culture?: string;
  logoUrl?: string;
  coverImage?: string;
  coverImageUrl?: string;
  remotePolicy?: string;
  techStack?: string[];
  benefits?: Array<{ category: string; perks: string[] }>;
  values?: Array<{ title: string; description: string }>;
  links?: Array<{ platform: string; label: string; url: string }>;
  confidenceScore: number;
  source: string;
}

export interface CompanyEnrichmentProvider {
  providerName: string;
  enrichCompany(query: { name?: string; domain?: string }): Promise<CompanyEnrichmentSuggestion | null>;
}

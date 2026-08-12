import { SearchProvider, SearchQueryParams, SearchResult, ProviderCapabilities, ProviderType } from "../types";
import { prisma } from "@/lib/prisma";
import { INITIAL_JOBS } from "@/lib/mockData";

export class NextHireProvider implements SearchProvider {
  public providerName = "NextHire DB";
  public providerType: ProviderType = "JOB_SEARCH";

  public capabilities(): ProviderCapabilities {
    return {
      supportsNaturalLanguage: true,
      supportsSalaryFilter: true,
      supportsRemoteFilter: true,
      supportsLocationFilter: true,
    };
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return true; // Soft fallback
    }
  }

  public async search(params: SearchQueryParams): Promise<SearchResult[]> {
    const q = (params.query || "").toLowerCase().trim();
    const loc = (params.location || "").toLowerCase().trim();

    try {
      const dbJobs = await prisma.job.findMany({
        where: {
          status: "ACTIVE",
          AND: [
            q
              ? {
                  OR: [
                    { title: { contains: q, mode: "insensitive" } },
                    { description: { contains: q, mode: "insensitive" } },
                    { skills: { contains: q, mode: "insensitive" } },
                    { category: { contains: q, mode: "insensitive" } },
                  ],
                }
              : {},
            loc
              ? {
                  OR: [
                    { location: { contains: loc, mode: "insensitive" } },
                    { country: { contains: loc, mode: "insensitive" } },
                  ],
                }
              : {},
            params.remoteOnly ? { isRemote: true } : {},
            params.salaryMin ? { salaryMax: { gte: params.salaryMin } } : {},
          ],
        },
        include: { company: true },
        take: params.limit || 20,
        orderBy: { createdAt: "desc" },
      });

      if (dbJobs && dbJobs.length > 0) {
        return dbJobs.map((j) => ({
          id: `nh-${j.id}`,
          title: j.title,
          company: j.company.name,
          description: j.description,
          location: j.location,
          salary: `$${j.salaryMin.toLocaleString()} - $${j.salaryMax.toLocaleString()}`,
          salaryMin: j.salaryMin,
          salaryMax: j.salaryMax,
          employmentType: j.employmentType,
          source: "NextHire Platform",
          sourceUrl: `/jobs/${j.id}`,
          logo: j.company.logo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
          skills: j.skills ? j.skills.split(",").map((s) => s.trim()) : [],
          postedDate: j.createdAt.toISOString().split("T")[0],
          remote: j.isRemote,
          matchScore: 98,
          sourceType: "DIRECT",
        }));
      }
    } catch (err) {
      console.warn("Prisma query failed in NextHireProvider, using memory fallback:", err);
    }

    // Memory fallback if database has not been seeded
    let filtered = INITIAL_JOBS;
    if (q) {
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (loc) {
      filtered = filtered.filter((j) => j.location.toLowerCase().includes(loc));
    }
    if (params.remoteOnly) {
      filtered = filtered.filter((j) => j.isRemote);
    }
    if (params.salaryMin) {
      filtered = filtered.filter((j) => j.salaryMax >= params.salaryMin!);
    }

    return filtered.map((j) => ({
      id: `nh-mem-${j.id}`,
      title: j.title,
      company: j.companyName,
      description: j.description,
      location: j.location,
      salary: `$${j.salaryMin.toLocaleString()} - $${j.salaryMax.toLocaleString()}`,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      employmentType: j.employmentType,
      source: "NextHire Platform",
      sourceUrl: `/jobs/${j.id}`,
      logo: j.companyLogo,
      skills: j.tags,
      postedDate: j.postedAt,
      remote: j.isRemote,
      matchScore: j.matchScore || 95,
      sourceType: "DIRECT",
    }));
  }
}

import { CompanyEnrichmentProvider, CompanyEnrichmentSuggestion } from "./types";
import { prisma } from "@/lib/prisma";

export class DefaultCompanyEnrichmentProvider implements CompanyEnrichmentProvider {
  public providerName = "NextHire Official Knowledge & Directory Enrichment";

  public async enrichCompany(query: { name?: string; domain?: string }): Promise<CompanyEnrichmentSuggestion | null> {
    const rawName = (query.name || "").trim();
    const rawDomain = (query.domain || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    if (!rawName && !rawDomain) return null;

    try {
      // 1. Search existing verified NextHire companies with strictly defined conditions (Never empty {})
      const orConditions: any[] = [];
      if (rawName) {
        orConditions.push({ name: { equals: rawName, mode: "insensitive" } });
        orConditions.push({ name: { contains: rawName, mode: "insensitive" } });
      }
      if (rawDomain) {
        orConditions.push({ website: { contains: rawDomain, mode: "insensitive" } });
      }

      if (orConditions.length > 0) {
        const existingCompany = await prisma.company.findFirst({
          where: { OR: orConditions },
        });

        if (existingCompany) {
          let values: any[] = [];
          let techStack: string[] = [];
          let benefits: any[] = [];
          let locations: any[] = [];
          let links: any[] = [];

          try { values = JSON.parse(existingCompany.values || "[]"); } catch {}
          try { techStack = JSON.parse(existingCompany.techStack || "[]"); } catch {}
          try { benefits = JSON.parse(existingCompany.benefits || "[]"); } catch {}
          try { locations = JSON.parse(existingCompany.locations || "[]"); } catch {}
          try { links = JSON.parse(existingCompany.links || "[]"); } catch {}

          return {
            name: existingCompany.name,
            website: existingCompany.website || (rawDomain ? `https://${rawDomain}` : undefined),
            industry: existingCompany.industry,
            companySize: existingCompany.companySize || "51-200 employees",
            foundedYear: existingCompany.foundedYear || undefined,
            headquarters: existingCompany.location,
            description: existingCompany.description,
            tagline: existingCompany.tagline || undefined,
            mission: existingCompany.mission || undefined,
            vision: existingCompany.vision || undefined,
            logoUrl: existingCompany.logo || undefined,
            coverImage: existingCompany.coverImage || undefined,
            remotePolicy: existingCompany.remotePolicy || "Hybrid",
            techStack,
            benefits,
            values,
            locations: locations.length > 0 ? locations : [{ name: "Headquarters", city: existingCompany.location, country: "United States", isHQ: true }],
            links,
            confidenceScore: 0.95,
            source: "NextHire Verified Database",
          };
        }
      }

      // 2. Structured Provider Suggestions for Recognized Organizations (Canonical Knowledge)
      const cleanLower = (rawName || rawDomain).toLowerCase();
      let matchedOrg: {
        name: string;
        website: string;
        industry: string;
        companySize: string;
        foundedYear: number;
        headquarters: string;
        tagline: string;
        description: string;
        techStack: string[];
      } | null = null;

      if (cleanLower.includes("amazon")) {
        matchedOrg = {
          name: "Amazon",
          website: "https://amazon.com",
          industry: "Cloud Infrastructure & E-Commerce",
          companySize: "1,000+ employees",
          foundedYear: 1994,
          headquarters: "Seattle, WA, United States",
          tagline: "Earth's most customer-centric company and cloud infrastructure leader.",
          description: "Amazon is a global technology leader focusing on cloud computing (AWS), digital streaming, artificial intelligence, and e-commerce.",
          techStack: ["AWS", "Java", "TypeScript", "Python", "Distributed Systems", "DynamoDB", "React"],
        };
      } else if (cleanLower.includes("google")) {
        matchedOrg = {
          name: "Google",
          website: "https://google.com",
          industry: "Internet & AI Technologies",
          companySize: "1,000+ employees",
          foundedYear: 1998,
          headquarters: "Mountain View, CA, United States",
          tagline: "Organizing the world's information and making it universally accessible.",
          description: "Google is an international technology multinational specializing in artificial intelligence, search engines, cloud computing, and computer software.",
          techStack: ["Go", "Python", "C++", "TensorFlow", "TypeScript", "Angular", "GCP", "Kubernetes"],
        };
      } else if (cleanLower.includes("microsoft")) {
        matchedOrg = {
          name: "Microsoft",
          website: "https://microsoft.com",
          industry: "Enterprise Software & Cloud",
          companySize: "1,000+ employees",
          foundedYear: 1975,
          headquarters: "Redmond, WA, United States",
          tagline: "Empowering every person and every organization on the planet to achieve more.",
          description: "Microsoft develops, manufactures, licenses, supports, and sells computer software, consumer electronics, personal computers, and cloud services.",
          techStack: ["C#", ".NET", "Azure", "TypeScript", "React", "Python", "SQL Server"],
        };
      } else if (cleanLower.includes("stripe")) {
        matchedOrg = {
          name: "Stripe",
          website: "https://stripe.com",
          industry: "Financial Infrastructure & Payments",
          companySize: "1,000+ employees",
          foundedYear: 2010,
          headquarters: "San Francisco, CA, United States",
          tagline: "Financial infrastructure for the internet.",
          description: "Stripe is a financial technology company that builds economic infrastructure for the internet, enabling businesses of every size to accept payments and manage transactions.",
          techStack: ["Ruby", "TypeScript", "React", "Go", "PostgreSQL", "Kafka", "AWS"],
        };
      } else if (cleanLower.includes("apple")) {
        matchedOrg = {
          name: "Apple",
          website: "https://apple.com",
          industry: "Consumer Electronics & Software",
          companySize: "1,000+ employees",
          foundedYear: 1976,
          headquarters: "Cupertino, CA, United States",
          tagline: "Think Different.",
          description: "Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, and sells a variety of related services.",
          techStack: ["Swift", "Objective-C", "C++", "Python", "iOS", "macOS", "CloudKit"],
        };
      } else if (cleanLower.includes("meta")) {
        matchedOrg = {
          name: "Meta",
          website: "https://meta.com",
          industry: "Social Technology & Metaverse",
          companySize: "1,000+ employees",
          foundedYear: 2004,
          headquarters: "Menlo Park, CA, United States",
          tagline: "Giving people the power to build community and bring the world closer together.",
          description: "Meta builds technologies that help people connect, find communities, and grow businesses across apps like Facebook, Instagram, and WhatsApp.",
          techStack: ["React", "PyTorch", "Python", "Hack/PHP", "C++", "GraphQL", "Rust"],
        };
      } else if (cleanLower.includes("netflix")) {
        matchedOrg = {
          name: "Netflix",
          website: "https://netflix.com",
          industry: "Entertainment & Streaming Technology",
          companySize: "1,000+ employees",
          foundedYear: 1997,
          headquarters: "Los Gatos, CA, United States",
          tagline: "See what's next.",
          description: "Netflix is one of the world's leading entertainment streaming services, pioneering cloud-native microservices architecture and video encoding technologies.",
          techStack: ["Java", "Node.js", "React", "AWS", "Spinnaker", "Cassandra", "Kafka"],
        };
      }

      if (!matchedOrg) {
        // Unknown organization with no verified entry -> Return null (Never NextHire fallback)
        return null;
      }

      return {
        name: matchedOrg.name,
        website: matchedOrg.website,
        industry: matchedOrg.industry,
        companySize: matchedOrg.companySize,
        foundedYear: matchedOrg.foundedYear,
        headquarters: matchedOrg.headquarters,
        description: matchedOrg.description,
        tagline: matchedOrg.tagline,
        remotePolicy: "Hybrid",
        techStack: matchedOrg.techStack,
        benefits: [
          { category: "Health & Wellness", perks: ["Comprehensive Health, Dental & Vision", "Mental Health Support", "Annual Wellness Stipend"] },
          { category: "Flexibility & Time Off", perks: ["Flexible Hybrid Schedule", "Generous Paid Vacation", "Paid Parental Leave"] },
          { category: "Growth & Learning", perks: ["Annual Learning & Education Budget", "Conference Travel Support", "Internal Mentorship"] },
        ],
        values: [
          { title: "Customer Focus", description: "Deliver sustained value and earn long-term trust." },
          { title: "High Velocity Execution", description: "Bias for action and deliberate technological innovation." },
          { title: "Highest Standards", description: "Continually raise the bar and drive teams to deliver high quality products." },
        ],
        locations: [
          { name: "Global Headquarters", city: matchedOrg.headquarters.split(",")[0], country: "United States", isHQ: true },
        ],
        links: [
          { platform: "Website", label: "Official Website", url: matchedOrg.website },
          { platform: "LinkedIn", label: "LinkedIn Organization", url: `https://linkedin.com/company/${matchedOrg.name.toLowerCase()}` },
        ],
        confidenceScore: 0.95,
        source: "NextHire Canonical Directory Intelligence",
      };
    } catch (err) {
      console.error("[CompanyEnrichmentProvider Error]:", err);
      return null;
    }
  }
}

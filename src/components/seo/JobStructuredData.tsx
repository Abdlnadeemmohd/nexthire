import React from "react";

interface JobStructuredDataProps {
  job: {
    id: string;
    title: string;
    description: string;
    companyName: string;
    location: string;
    salaryMin?: number;
    salaryMax?: number;
    employmentType?: string;
    postedAt?: string;
    isRemote?: boolean;
  };
}

export function JobStructuredData({ job }: JobStructuredDataProps) {
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: job.companyName,
      value: job.id,
    },
    datePosted: job.postedAt || new Date().toISOString(),
    employmentType: job.employmentType === "FULL_TIME" ? "FULL_TIME" : "CONTRACT",
    hiringOrganization: {
      "@type": "Organization",
      name: job.companyName,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
      },
    },
    applicantLocationRequirements: job.isRemote
      ? {
          "@type": "Country",
          name: "Global / Remote",
        }
      : undefined,
    baseSalary: job.salaryMin && job.salaryMax
      ? {
          "@type": "MonetaryAmount",
          currency: "USD",
          value: {
            "@type": "QuantitativeValue",
            minValue: job.salaryMin,
            maxValue: job.salaryMax,
            unitText: "YEAR",
          },
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

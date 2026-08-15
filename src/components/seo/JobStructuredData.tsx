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
    validThrough?: string;
    isRemote?: boolean;
    skills?: string | string[];
  };
}

export function JobStructuredData({ job }: JobStructuredDataProps) {
  const formattedSkills = Array.isArray(job.skills)
    ? job.skills.join(", ")
    : typeof job.skills === "string"
    ? job.skills
    : undefined;

  // Calculate default validThrough date (30 days from posting if not specified)
  const defaultValidThrough = () => {
    const postDate = job.postedAt ? new Date(job.postedAt) : new Date();
    const expiry = new Date(postDate);
    expiry.setDate(expiry.getDate() + 30);
    return expiry.toISOString();
  };

  const jsonLd: Record<string, any> = {
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
    validThrough: job.validThrough || defaultValidThrough(),
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
    directApply: true,
  };

  if (job.isRemote) {
    jsonLd.applicantLocationRequirements = {
      "@type": "Country",
      name: "Global / Remote",
    };
  }

  if (formattedSkills) {
    jsonLd.skills = formattedSkills;
  }

  if (job.salaryMin && job.salaryMax) {
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: "YEAR",
      },
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

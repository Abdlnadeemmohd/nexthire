import { SearchQueryParams } from "./types";

export class AIQueryParser {
  public parseNaturalLanguageQuery(input: string): SearchQueryParams {
    const text = input.trim();
    if (!text) return {};

    const lower = text.toLowerCase();
    const params: SearchQueryParams = { query: text };

    // Remote detection
    if (lower.includes("remote") || lower.includes("work from home") || lower.includes("wfh")) {
      params.remoteOnly = true;
    }

    // Salary extraction (e.g., "$100k", "100,000", "paying more than 120k")
    const salaryMatch = lower.match(/(?:\$|>|over|paying|min|salary)?\s*(\d{2,3})(?:k|,000)/i);
    if (salaryMatch && salaryMatch[1]) {
      const parsedVal = parseInt(salaryMatch[1], 10);
      if (!isNaN(parsedVal)) {
        params.salaryMin = parsedVal > 1000 ? parsedVal : parsedVal * 1000;
      }
    }

    // Common role keywords cleanup for query field
    let cleanQuery = text
      .replace(/find/gi, "")
      .replace(/search/gi, "")
      .replace(/jobs/gi, "")
      .replace(/remote/gi, "")
      .replace(/paying/gi, "")
      .replace(/more than/gi, "")
      .replace(/over/gi, "")
      .replace(/\$\d+k?/gi, "")
      .trim();

    if (cleanQuery.length > 2) {
      params.query = cleanQuery;
    }

    return params;
  }
}

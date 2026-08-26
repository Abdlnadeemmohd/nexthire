/**
 * NextHire Phase 12 — External Market Data Provider Architecture
 * Provides an extensible abstraction for external labor market data sources.
 * When unconfigured, safely returns INSUFFICIENT_EXTERNAL_MARKET_DATA without fabricating numbers.
 */

import { MarketConfidence, MarketSourceType } from "./types";

export interface ExternalMarketQuery {
  role?: string;
  skills?: string[];
  location?: string;
  country?: string;
  experienceYears?: number;
}

export interface ExternalMarketResponse<T> {
  sourceType: MarketSourceType;
  status: "CONFIGURED" | "NOT_CONFIGURED" | "INSUFFICIENT_EXTERNAL_MARKET_DATA";
  data: T | null;
  sampleSize: number;
  lastUpdated: Date;
  confidence: MarketConfidence;
  disclaimer: string;
}

export interface MarketDataProvider {
  getTalentSupply(query: ExternalMarketQuery): Promise<ExternalMarketResponse<{ estimatedMarketPool: number }>>;
  getSkillDemand(skill: string, location?: string): Promise<ExternalMarketResponse<{ relativeDemand: string; salaryBenchmark?: { min: number; max: number; median: number } }>>;
  getLocationSupply(location: string, role?: string): Promise<ExternalMarketResponse<{ regionalLaborIndex: number }>>;
  getMarketTrend(timeframe: string, role?: string): Promise<ExternalMarketResponse<{ YoYGrowthPercent: number }>>;
}

/**
 * Default provider implementation when no third-party labor market feed is integrated.
 * Ensures zero fabricated external statistics.
 */
export class UnconfiguredMarketDataProvider implements MarketDataProvider {
  private readonly defaultDisclaimer =
    "External labor market data provider is not configured. All presented talent supply metrics strictly represent NextHire's observed candidate ecosystem.";

  async getTalentSupply(query: ExternalMarketQuery): Promise<ExternalMarketResponse<{ estimatedMarketPool: number }>> {
    return {
      sourceType: "INSUFFICIENT_DATA",
      status: "NOT_CONFIGURED",
      data: null,
      sampleSize: 0,
      lastUpdated: new Date(),
      confidence: "INSUFFICIENT",
      disclaimer: this.defaultDisclaimer,
    };
  }

  async getSkillDemand(skill: string, location?: string): Promise<ExternalMarketResponse<{ relativeDemand: string; salaryBenchmark?: { min: number; max: number; median: number } }>> {
    return {
      sourceType: "INSUFFICIENT_DATA",
      status: "NOT_CONFIGURED",
      data: null,
      sampleSize: 0,
      lastUpdated: new Date(),
      confidence: "INSUFFICIENT",
      disclaimer: this.defaultDisclaimer,
    };
  }

  async getLocationSupply(location: string, role?: string): Promise<ExternalMarketResponse<{ regionalLaborIndex: number }>> {
    return {
      sourceType: "INSUFFICIENT_DATA",
      status: "NOT_CONFIGURED",
      data: null,
      sampleSize: 0,
      lastUpdated: new Date(),
      confidence: "INSUFFICIENT",
      disclaimer: this.defaultDisclaimer,
    };
  }

  async getMarketTrend(timeframe: string, role?: string): Promise<ExternalMarketResponse<{ YoYGrowthPercent: number }>> {
    return {
      sourceType: "INSUFFICIENT_DATA",
      status: "NOT_CONFIGURED",
      data: null,
      sampleSize: 0,
      lastUpdated: new Date(),
      confidence: "INSUFFICIENT",
      disclaimer: this.defaultDisclaimer,
    };
  }
}

export const defaultMarketDataProvider = new UnconfiguredMarketDataProvider();

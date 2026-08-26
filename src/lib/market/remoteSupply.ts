/**
 * NextHire Phase 12 — Remote & Hybrid Talent Supply Engine
 * Analyzes candidate work preference distributions and evaluates remote supply health.
 */

import { prisma } from "@/lib/prisma";
import { RemoteSupplyLevel, RemoteSupplyMetric } from "./types";

/**
 * Calculates remote/hybrid candidate supply.
 */
export async function calculateRemoteSupply(jobId?: string): Promise<RemoteSupplyMetric[]> {
  const allDiscoverable = await prisma.user.findMany({
    where: {
      role: "JOB_SEEKER",
      isDiscoverable: true,
    },
    include: {
      profile: true,
    },
  });

  const totalPool = allDiscoverable.length;

  if (totalPool === 0) {
    return [];
  }

  let remoteOnlyCount = 0;
  let hybridOrRemoteCount = 0;
  let onsiteCount = 0;

  for (const cand of allDiscoverable) {
    let prefs: any = {};
    try {
      if (cand.profile?.preferences) {
        prefs = JSON.parse(cand.profile.preferences);
      }
    } catch {}

    const remotePref = prefs.remotePreference || prefs.workModelPreference;

    if (remotePref === "REMOTE_ONLY") {
      remoteOnlyCount++;
    } else if (remotePref === "HYBRID_OR_REMOTE" || remotePref === "HYBRID" || !cand.location) {
      hybridOrRemoteCount++;
    } else {
      onsiteCount++;
    }
  }

  const remoteCapableTotal = remoteOnlyCount + hybridOrRemoteCount;
  const remoteCapableShare = totalPool > 0 ? (remoteCapableTotal / totalPool) * 100 : 0;

  let overallStatus: RemoteSupplyLevel = "INSUFFICIENT_DATA";
  if (totalPool < 5) {
    overallStatus = "INSUFFICIENT_DATA";
  } else if (remoteCapableShare >= 40) {
    overallStatus = "REMOTE_SUPPLY_HEALTHY";
  } else if (remoteCapableShare >= 20) {
    overallStatus = "REMOTE_SUPPLY_LIMITED";
  } else {
    overallStatus = "REMOTE_SUPPLY_SCARCE";
  }

  const metrics: RemoteSupplyMetric[] = [
    {
      remotePreference: "Remote Only",
      candidateCount: remoteOnlyCount,
      percentageOfPool: totalPool > 0 ? Math.round((remoteOnlyCount / totalPool) * 100) : 0,
      status: overallStatus,
      summary: `${remoteOnlyCount} candidate(s) exclusively seek 100% remote roles.`,
    },
    {
      remotePreference: "Hybrid or Remote Compatible",
      candidateCount: hybridOrRemoteCount,
      percentageOfPool: totalPool > 0 ? Math.round((hybridOrRemoteCount / totalPool) * 100) : 0,
      status: overallStatus,
      summary: `${hybridOrRemoteCount} candidate(s) are open to hybrid or remote arrangements.`,
    },
    {
      remotePreference: "Onsite Preferred",
      candidateCount: onsiteCount,
      percentageOfPool: totalPool > 0 ? Math.round((onsiteCount / totalPool) * 100) : 0,
      status: overallStatus,
      summary: `${onsiteCount} candidate(s) prefer or require onsite office presence.`,
    },
  ];

  return metrics;
}

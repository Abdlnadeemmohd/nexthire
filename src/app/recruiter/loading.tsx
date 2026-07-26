import React from "react";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function RecruiterLoading() {
  return (
    <div className="min-h-screen bg-surface p-8 space-y-8 animate-pulse">
      <div className="h-8 bg-surface-container-high rounded-xl w-64"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

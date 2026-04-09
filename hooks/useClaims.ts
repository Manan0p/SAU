"use client";

import { useState, useCallback } from "react";
import { getClaims, submitClaim } from "@/lib/api";
import type { Claim } from "@/types";

export function useClaims(userId: string) {
  const [claims, setClaims] = useState<Claim[]>(() =>
    typeof window !== "undefined" ? getClaims(userId) : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setClaims(getClaims(userId));
  }, [userId]);

  const submit = useCallback(
    async (data: Omit<Claim, "id" | "status" | "createdAt">) => {
      setLoading(true);
      setError(null);
      const result = submitClaim(data);
      setLoading(false);
      if (result.success) {
        refresh();
        return { success: true as const };
      }
      setError(result.error);
      return { success: false as const, error: result.error };
    },
    [refresh]
  );

  const pending = claims.filter((c) => c.status === "pending");
  const approved = claims.filter((c) => c.status === "approved");
  const rejected = claims.filter((c) => c.status === "rejected");
  const totalPending = pending.reduce((s, c) => s + c.amount, 0);
  const totalApproved = approved.reduce((s, c) => s + c.amount, 0);

  return { claims, pending, approved, rejected, totalPending, totalApproved, loading, error, submit, refresh };
}

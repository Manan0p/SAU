"use client";

import { useState, useCallback, useEffect } from "react";
import { getClaims, submitClaim } from "@/lib/api";
import type { Claim } from "@/types";

export function useClaims(userId: string) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const data = await getClaims(userId);
    setClaims(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = useCallback(
    async (data: Omit<Claim, "id" | "status" | "createdAt">) => {
      setLoading(true);
      setError(null);
      const result = await submitClaim(data);
      if (result.success) {
        await refresh();
        return { success: true as const };
      }
      setLoading(false);
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

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  createSosRequest,
  getActiveSosRequests,
  getAllSosRequests,
  resolveSosRequest,
  respondToSos,
} from "@/lib/api";
import type { SosRequest } from "@/types";

/** Hook for the student SOS trigger + own SOS history */
export function useSos(userId: string) {
  const [activeSos, setActiveSos] = useState<SosRequest | null>(null);
  const [history, setHistory] = useState<SosRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    // Load user's SOS history
    if (!userId) return;
    getAllSosRequests().then((data) => {
      const mine = data.filter((s) => s.userId === userId);
      setHistory(mine);
      const existing = mine.find((s) => s.status !== "resolved");
      if (existing) setActiveSos(existing);
    });

    // Realtime subscription on own SOS updates
    const channel = supabase
      .channel(`sos-user-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sos_requests", filter: `userId=eq.${userId}` },
        (payload) => {
          const updated = payload.new as SosRequest;
          setActiveSos((prev) => (prev?.id === updated.id ? updated : prev));
          setHistory((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [userId]);

  const triggerSos = useCallback(
    async (userName: string, userPhone?: string, collegeId?: string, message?: string) => {
      setLoading(true);

      const getLocation = (): Promise<GeolocationPosition> =>
        new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          })
        );

      try {
        const pos = await getLocation();
        const result = await createSosRequest({
          userId,
          userName,
          userPhone,
          collegeId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          message,
        });

        if (result.success) {
          setActiveSos(result.sos);
          setHistory((prev) => [result.sos, ...prev]);
          setLoading(false);
          return { success: true as const };
        }
        setLoading(false);
        return { success: false as const, error: result.error };
      } catch {
        setLoading(false);
        return { success: false as const, error: "Location access denied. Please enable GPS." };
      }
    },
    [userId]
  );

  const resolveOwn = useCallback(
    async (sosId: string) => {
      const result = await resolveSosRequest(sosId, userId, "Self-resolved");
      if (result.success) setActiveSos(null);
      return result;
    },
    [userId]
  );

  return { activeSos, history, loading, triggerSos, resolveOwn };
}

/** Hook for authorized responders (doctor / medical_center / admin) - shows ALL active SOS on map */
export function useSosMonitor() {
  const [activeSosRequests, setActiveSosRequests] = useState<SosRequest[]>([]);
  const [allSosRequests, setAllSosRequests] = useState<SosRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [active, all] = await Promise.all([getActiveSosRequests(), getAllSosRequests()]);
      setActiveSosRequests(active);
      setAllSosRequests(all);
      setLoading(false);
    };
    load();

    // realtime: listen to all SOS changes
    const channel = supabase
      .channel("sos-monitor-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sos_requests" },
        () => {
          // Re-fetch on any change
          load();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const respond = useCallback(async (sosId: string) => {
    return respondToSos(sosId);
  }, []);

  const resolve = useCallback(async (sosId: string, resolvedById: string, note: string) => {
    return resolveSosRequest(sosId, resolvedById, note);
  }, []);

  return { activeSosRequests, allSosRequests, loading, respond, resolve };
}

"use client";

import { useState, useCallback, useEffect } from "react";
import { getAppointments, createAppointment, cancelAppointment } from "@/lib/api";
import type { Appointment } from "@/types";

export function useAppointments(userId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const data = await getAppointments(userId);
    setAppointments(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const book = useCallback(
    async (data: Omit<Appointment, "id">) => {
      setLoading(true);
      setError(null);
      const result = await createAppointment(data);
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

  const cancel = useCallback(
    async (appointmentId: string) => {
      setLoading(true);
      const result = await cancelAppointment(appointmentId, userId);
      if (result.success) {
        await refresh();
        return { success: true as const };
      }
      setLoading(false);
      return { success: false as const, error: result.error ?? "Failed" };
    },
    [userId, refresh]
  );

  const upcoming = appointments.filter((a) => a.status === "booked");
  const past = appointments.filter((a) => a.status !== "booked");

  return { appointments, upcoming, past, loading, error, book, cancel, refresh };
}

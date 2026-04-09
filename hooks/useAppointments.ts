"use client";

import { useState, useCallback } from "react";
import { getAppointments, createAppointment, cancelAppointment } from "@/lib/api";
import type { Appointment } from "@/types";

export function useAppointments(userId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    typeof window !== "undefined" ? getAppointments(userId) : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setAppointments(getAppointments(userId));
  }, [userId]);

  const book = useCallback(
    async (data: Omit<Appointment, "id">) => {
      setLoading(true);
      setError(null);
      const result = createAppointment(data);
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

  const cancel = useCallback(
    async (appointmentId: string) => {
      setLoading(true);
      const result = cancelAppointment(appointmentId, userId);
      setLoading(false);
      if (result.success) {
        refresh();
        return { success: true as const };
      }
      return { success: false as const, error: result.error ?? "Failed" };
    },
    [userId, refresh]
  );

  const upcoming = appointments.filter((a) => a.status === "booked");
  const past = appointments.filter((a) => a.status !== "booked");

  return { appointments, upcoming, past, loading, error, book, cancel, refresh };
}

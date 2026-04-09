import type { Appointment, Claim } from "@/types";
import { generateId } from "./utils";

// ─── Storage Keys ───────────────────────────────────────────
const APPOINTMENTS_KEY = "uniwell_appointments";
const CLAIMS_KEY = "uniwell_claims";

// ─── Appointments ────────────────────────────────────────────

function readAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAppointments(data: Appointment[]): void {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(data));
}

export function getAppointments(userId: string): Appointment[] {
  return readAppointments().filter((a) => a.userId === userId);
}

export function createAppointment(
  data: Omit<Appointment, "id">
): { success: true; appointment: Appointment } | { success: false; error: string } {
  const all = readAppointments();

  // Prevent double booking the same slot with the same doctor
  const duplicate = all.find(
    (a) =>
      a.userId === data.userId &&
      a.doctorId === data.doctorId &&
      a.timeSlot === data.timeSlot &&
      a.status === "booked"
  );

  if (duplicate) {
    return { success: false, error: "You already have this slot booked." };
  }

  const appointment: Appointment = { id: "apt_" + generateId(), ...data };
  writeAppointments([...all, appointment]);
  return { success: true, appointment };
}

export function cancelAppointment(
  appointmentId: string,
  userId: string
): { success: boolean; error?: string } {
  const all = readAppointments();
  const idx = all.findIndex((a) => a.id === appointmentId && a.userId === userId);
  if (idx === -1) return { success: false, error: "Appointment not found." };
  all[idx].status = "cancelled";
  writeAppointments(all);
  return { success: true };
}

// ─── Insurance Claims ─────────────────────────────────────────

function readClaims(): Claim[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CLAIMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeClaims(data: Claim[]): void {
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(data));
}

export function getClaims(userId: string): Claim[] {
  return readClaims()
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function submitClaim(
  data: Omit<Claim, "id" | "status" | "createdAt">
): { success: true; claim: Claim } | { success: false; error: string } {
  if (!data.description.trim()) {
    return { success: false, error: "Description is required." };
  }
  if (data.amount <= 0) {
    return { success: false, error: "Amount must be greater than 0." };
  }

  const claim: Claim = {
    id: "clm_" + generateId(),
    status: "pending",
    createdAt: new Date().toISOString(),
    ...data,
  };
  writeClaims([...readClaims(), claim]);
  return { success: true, claim };
}

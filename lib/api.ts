import { supabase } from "./supabase";
import type { Appointment, Claim } from "@/types";

// ─── Appointments ────────────────────────────────────────────

export async function getAppointments(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("userId", userId)
    .order("timeSlot", { ascending: true });

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
  return data as Appointment[];
}

export async function createAppointment(
  data: Omit<Appointment, "id">
): Promise<{ success: true; appointment: Appointment } | { success: false; error: string }> {
  // Prevent double booking
  const { data: existing } = await supabase
    .from("appointments")
    .select("id")
    .eq("userId", data.userId)
    .eq("doctorId", data.doctorId)
    .eq("timeSlot", data.timeSlot)
    .eq("status", "booked")
    .maybeSingle();

  if (existing) {
    return { success: false, error: "You already have this slot booked." };
  }

  const { data: newAppointment, error } = await supabase
    .from("appointments")
    .insert([{
      userId: data.userId,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      specialty: data.specialty,
      timeSlot: data.timeSlot,
      date: data.date,
      status: "booked",
      notes: data.notes
    }])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, appointment: newAppointment as Appointment };
}

export async function cancelAppointment(
  appointmentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .match({ id: appointmentId, userId: userId });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ─── Insurance Claims ─────────────────────────────────────────

export async function getClaims(userId: string): Promise<Claim[]> {
  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching claims:", error);
    return [];
  }
  return data as Claim[];
}

export async function submitClaim(
  data: Omit<Claim, "id" | "status" | "createdAt">
): Promise<{ success: true; claim: Claim } | { success: false; error: string }> {
  if (!data.description.trim()) {
    return { success: false, error: "Description is required." };
  }
  if (data.amount <= 0) {
    return { success: false, error: "Amount must be greater than 0." };
  }

  const { data: newClaim, error } = await supabase
    .from("claims")
    .insert([{
      userId: data.userId,
      amount: data.amount,
      description: data.description,
      status: "pending",
      fileUrl: data.fileUrl,
      createdAt: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, claim: newClaim as Claim };
}

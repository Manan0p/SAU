import { supabase } from "./supabase";
import type {
  Appointment,
  Claim,
  MedicalRecord,
  Prescription,
  SosRequest,
  Notification,
  InventoryItem,
} from "@/types";

// ─── Appointments ─────────────────────────────────────────────

export async function getAppointments(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("userId", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching appointments:", error.message, error.details, error.hint);
    return [];
  }
  return data as Appointment[];
}

/** Doctors: get all appointments */
export async function getAllAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .order("timeSlot", { ascending: true });
  if (error) { console.error(error); return []; }
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

  if (existing) return { success: false, error: "You already have this slot booked." };

  const { data: newAppt, error } = await supabase
    .from("appointments")
    .insert([{
      userId: data.userId,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
      specialty: data.specialty,
      timeSlot: data.timeSlot,
      date: data.date,
      status: "booked",
      notes: data.notes,
    }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, appointment: newAppt as Appointment };
}

export async function cancelAppointment(
  appointmentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .match({ id: appointmentId, userId });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "completed" | "cancelled"
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);
  if (error) return { success: false, error: error.message };
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
    console.error("Error fetching claims:", error.message, error.details, error.hint);
    return [];
  }
  return data as Claim[];
}

/** Insurance / Admin: get all claims */
export async function getAllClaims(): Promise<Claim[]> {
  const { data, error } = await supabase
    .from("claims")
    .select("*, profiles!claims_userId_fkey(name, college_id)")
    .order("createdAt", { ascending: false });
  if (error) { console.error(error); return []; }
  return data as Claim[];
}

export async function submitClaim(
  data: Omit<Claim, "id" | "status" | "createdAt">
): Promise<{ success: true; claim: Claim } | { success: false; error: string }> {
  if (!data.description.trim()) return { success: false, error: "Description is required." };
  if (data.amount <= 0) return { success: false, error: "Amount must be greater than 0." };

  const { data: newClaim, error } = await supabase
    .from("claims")
    .insert([{
      userId: data.userId,
      amount: data.amount,
      description: data.description,
      status: "pending",
      fileUrl: data.fileUrl,
      createdAt: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, claim: newClaim as Claim };
}

export async function reviewClaim(
  claimId: string,
  reviewerId: string,
  status: "approved" | "rejected",
  reviewNote: string,
  approvedAmount?: number
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("claims")
    .update({
      status,
      reviewedBy: reviewerId,
      reviewNote,
      approvedAmount: status === "approved" ? approvedAmount : null,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", claimId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Medical Records ─────────────────────────────────────────

export async function getMyMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
  const { data, error } = await supabase
    .from("medical_records")
    .select("*")
    .eq("patientId", patientId)
    .order("visitDate", { ascending: false });
  if (error) { console.error(error); return []; }
  return data as MedicalRecord[];
}

export async function getAllMedicalRecords(): Promise<MedicalRecord[]> {
  const { data, error } = await supabase
    .from("medical_records")
    .select("*, profiles!medical_records_patientId_fkey(name, college_id)")
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data as MedicalRecord[];
}

export async function createMedicalRecord(
  record: Omit<MedicalRecord, "id" | "created_at">
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("medical_records")
    .insert([{
      patientId: record.patientId,
      doctorId: record.doctorId,
      doctorName: record.doctorName,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      prescription: record.prescription,
      notes: record.notes,
      visitDate: record.visitDate,
    }]);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Prescriptions ────────────────────────────────────────────

export async function getPrescriptions(patientId: string): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("patientId", patientId)
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data as Prescription[];
}

export async function getAllPrescriptions(): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data as Prescription[];
}

export async function updatePrescriptionStatus(
  id: string,
  status: "dispensed"
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("prescriptions").update({ status }).eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Pharmacy Inventory ───────────────────────────────────────

export async function getInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("pharmacy_inventory")
    .select("*")
    .order("name");
  if (error) { console.error(error); return []; }
  return data as InventoryItem[];
}

export async function updateInventoryQuantity(
  id: string,
  delta: number
): Promise<{ success: boolean; error?: string }> {
  const { data: item } = await supabase.from("pharmacy_inventory").select("quantity").eq("id", id).single();
  if (!item) return { success: false, error: "Item not found." };
  const { error } = await supabase
    .from("pharmacy_inventory")
    .update({ quantity: Math.max(0, item.quantity + delta), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── SOS Requests ────────────────────────────────────────────

export async function createSosRequest(
  data: {
    userId: string;
    userName: string;
    userPhone?: string;
    collegeId?: string;
    lat: number;
    lng: number;
    accuracy?: number;
    message?: string;
  }
): Promise<{ success: true; sos: SosRequest } | { success: false; error: string }> {
  const { data: newSos, error } = await supabase
    .from("sos_requests")
    .insert([{
      userId: data.userId,
      userName: data.userName,
      userPhone: data.userPhone,
      collegeId: data.collegeId,
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy,
      message: data.message,
      status: "active",
    }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, sos: newSos as SosRequest };
}

export async function getActiveSosRequests(): Promise<SosRequest[]> {
  const { data, error } = await supabase
    .from("sos_requests")
    .select("*")
    .in("status", ["active", "responding"])
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data as SosRequest[];
}

export async function getAllSosRequests(): Promise<SosRequest[]> {
  const { data, error } = await supabase
    .from("sos_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return data as SosRequest[];
}

export async function resolveSosRequest(
  sosId: string,
  resolvedById: string,
  resolvedNote: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("sos_requests")
    .update({
      status: "resolved",
      resolvedBy: resolvedById,
      resolvedNote,
      resolvedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sosId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function respondToSos(sosId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("sos_requests")
    .update({ status: "responding", updated_at: new Date().toISOString() })
    .eq("id", sosId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Notifications ────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("userId", userId)
    .order("created_at", { ascending: false })
    .limit(50);
    
  if (error) {
    console.error("Error fetching notifications:", error.message, error.details, error.hint);
    return [];
  }
  return data as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("userId", userId).eq("read", false);
}

export async function createNotification(data: {
  userId: string;
  type: Notification["type"];
  title: string;
  message: string;
  relatedId?: string;
}): Promise<void> {
  await supabase.from("notifications").insert([data]);
}

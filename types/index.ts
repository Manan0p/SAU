// ─────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────
export type UserRole =
  | "student"
  | "doctor"
  | "pharmacy"
  | "admin"
  | "insurance"
  | "medical_center";

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];         // multi-role support
  studentId?: string;        // alias for college_id
  college_id?: string;
  phone?: string;
  class?: string;
  branch?: string;
  batch?: string;
  blood_group?: string;
  medical_conditions?: string;
  avatar?: string;
}

// ─────────────────────────────────────────────
// APPOINTMENT
// ─────────────────────────────────────────────
export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  timeSlot: string;
  date: string;
  status: "booked" | "completed" | "cancelled";
  notes?: string;
}

// ─────────────────────────────────────────────
// INSURANCE CLAIM
// ─────────────────────────────────────────────
export interface Claim {
  id: string;
  userId: string;
  amount: number;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt?: string;
  fileUrl?: string;
  reviewedBy?: string;
  reviewNote?: string;
  approvedAmount?: number;
}

// ─────────────────────────────────────────────
// MEDICAL RECORD
// ─────────────────────────────────────────────
export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  diagnosis: string;
  treatment?: string;
  prescription?: string;
  notes?: string;
  visitDate: string;
  created_at: string;
  profiles?: {
    name: string;
    college_id?: string;
  } | null;
}

// ─────────────────────────────────────────────
// PRESCRIPTION
// ─────────────────────────────────────────────
export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  duration: string;
  qty: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  recordId?: string;
  medicines: PrescriptionMedicine[];
  instructions?: string;
  status: "pending" | "dispensed";
  created_at: string;
}

// ─────────────────────────────────────────────
// PHARMACY INVENTORY
// ─────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  generic_name?: string;
  category?: string;
  quantity: number;
  unit: string;
  threshold: number;
  price_per_unit: number;
  updated_at: string;
}

// ─────────────────────────────────────────────
// SOS REQUEST
// ─────────────────────────────────────────────
export interface SosRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  collegeId?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  status: "active" | "responding" | "resolved";
  message?: string;
  resolvedBy?: string;
  resolvedNote?: string;
  resolvedAt?: string;
  ambulanceCalled: boolean;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  type: "sos" | "appointment" | "insurance" | "general";
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  created_at: string;
}

// ─────────────────────────────────────────────
// DOCTOR (mock data shape)
// ─────────────────────────────────────────────
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  available: string[];
  avatar?: string;
}

// ─────────────────────────────────────────────
// AUTH STATE
// ─────────────────────────────────────────────
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginStaff: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  initAuth: (force?: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
export type ToastVariant = "default" | "success" | "destructive";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

// ─────────────────────────────────────────────
// USER
// id          → unique identifier (localStorage key, join key for relations)
// name        → display name shown across all views
// email       → used as the login credential
// role        → controls what features are accessible
// studentId   → campus ID for insurance & appointment references
// ─────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "doctor" | "admin";
  studentId: string;
  avatar?: string;
}

// ─────────────────────────────────────────────
// APPOINTMENT
// id          → unique booking reference
// userId      → links appointment to the student who booked
// doctorId    → links to which doctor (from mock list)
// doctorName  → denormalized for display without extra lookup
// specialty   → shown in UI cards for context
// timeSlot    → ISO date string of the appointment time
// date        → human-readable date string (display only)
// status      → tracks lifecycle: booked → completed / cancelled
// notes       → optional reason for visit
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
// CLAIM
// id          → unique claim reference
// userId      → links claim to the student
// amount      → claim value in INR
// description → what the claim is for (medical procedure, medicine, etc.)
// status      → tracks lifecycle: pending → approved / rejected
// createdAt   → timestamp for display and sorting
// fileUrl     → optional uploaded bill reference (simulated)
// ─────────────────────────────────────────────
export interface Claim {
  id: string;
  userId: string;
  amount: number;
  description: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  fileUrl?: string;
}

// ─────────────────────────────────────────────
// DOCTOR (mock data shape)
// id          → unique doctor identifier
// name        → displayed when selecting
// specialty   → helps student pick the right doctor
// available   → time slots the doctor has open
// avatar      → initials-based fallback or real URL
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  initAuth: () => void;
}

// ─────────────────────────────────────────────
// TOAST (notification)
// ─────────────────────────────────────────────
export type ToastVariant = "default" | "success" | "destructive";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

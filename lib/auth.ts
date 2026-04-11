import { supabase } from "./supabase";
import type { User, UserRole } from "@/types";

export const STAFF_ROLES: UserRole[] = ["doctor", "pharmacy", "insurance", "medical_center"];
export const ADMIN_ROLES: UserRole[] = ["admin"];

/** Maps a raw Supabase profile row to our User type */
function mapProfile(profile: Record<string, unknown>, email: string): User {
  return {
    id: profile.id as string,
    email,
    name: (profile.name as string) ?? "Unknown",
    roles: (profile.roles as UserRole[]) ?? ["student"],
    studentId: (profile.college_id as string) ?? "",
    college_id: (profile.college_id as string) ?? "",
    phone: profile.phone as string | undefined,
    class: profile.class as string | undefined,
    branch: profile.branch as string | undefined,
    batch: profile.batch as string | undefined,
    blood_group: profile.blood_group as string | undefined,
    medical_conditions: profile.medical_conditions as string | undefined,
    avatar: profile.avatar as string | undefined,
  };
}

// ─── Base Login (Internal) ──────────────────────────────────────
async function _baseLogin(
  email: string,
  password: string
): Promise<{ success: true; user: User } | { success: false; error: string }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message ?? "Login failed." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Profile not found. Please contact admin." };
    }

    return { success: true, user: mapProfile(profile, authData.user.email!) };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message ?? "Unexpected error." };
  }
}

// ─── Student Login ──────────────────────────────────────────────
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: true; user: User } | { success: false; error: string }> {
  const result = await _baseLogin(email, password);
  if (!result.success) return result;

  // Strict separation: Block Staff and Admins from the Student portal
  const hasStaffOrAdminRole = result.user.roles.some((r) => STAFF_ROLES.includes(r) || ADMIN_ROLES.includes(r));
  if (hasStaffOrAdminRole) {
    await supabase.auth.signOut();
    return { success: false, error: "Staff/Admin must log in through their respective portals." };
  }
  return result;
}

// ─── Staff Login ─────────────────────────────────────────────
export async function loginStaffUser(
  email: string,
  password: string
): Promise<{ success: true; user: User } | { success: false; error: string }> {
  const result = await _baseLogin(email, password);
  if (!result.success) return result;

  const hasStaffRole = STAFF_ROLES.some((r) => result.user.roles.includes(r));
  if (!hasStaffRole) {
    await supabase.auth.signOut();
    return { success: false, error: "You don't have staff access. Students must use the Student portal." };
  }
  return result;
}

// ─── Admin Login ─────────────────────────────────────────────
export async function loginAdminUser(
  email: string,
  password: string
): Promise<{ success: true; user: User } | { success: false; error: string }> {
  const result = await _baseLogin(email, password);
  if (!result.success) return result;

  if (!result.user.roles.includes("admin")) {
    await supabase.auth.signOut();
    return { success: false, error: "You don't have admin access." };
  }
  return result;
}

// ─── Google OAuth ──────────────────────────────────────────────
export async function loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Load Session ──────────────────────────────────────────────
export async function loadSession(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!profile) return null;
    return mapProfile(profile, session.user.email!);
  } catch {
    return null;
  }
}

// ─── Sign Out ─────────────────────────────────────────────────
export async function clearSession(): Promise<void> {
  if (typeof window !== "undefined") {
    await supabase.auth.signOut();
  }
}

// ─── Update Profile ───────────────────────────────────────────
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<User, "id" | "email" | "roles">>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("profiles")
    .update({
      name: updates.name,
      phone: updates.phone,
      class: updates.class,
      branch: updates.branch,
      batch: updates.batch,
      college_id: updates.college_id ?? updates.studentId,
      blood_group: updates.blood_group,
      medical_conditions: updates.medical_conditions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
// ─── Password Recovery ─────────────────────────────────────────
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

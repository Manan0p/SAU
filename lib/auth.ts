import { supabase } from "./supabase";
import type { User } from "@/types";

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: true; user: User } | { success: false; error: string }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || "Login failed." };
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "Profile not found." };
    }

    const user: User = {
      id: profile.id,
      email: authData.user.email!,
      name: profile.name,
      role: profile.role,
      studentId: profile.student_id,
      avatar: profile.avatar,
    };

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

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

    return {
      id: profile.id,
      email: session.user.email!,
      name: profile.name,
      role: profile.role,
      studentId: profile.student_id,
      avatar: profile.avatar,
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  if (typeof window !== "undefined") {
    await supabase.auth.signOut();
  }
}

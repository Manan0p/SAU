"use client";

import { create } from "zustand";
import { loginUser, loadSession, clearSession } from "@/lib/auth";
import type { AuthState } from "@/types";

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /** Called once on app mount to rehydrate session */
  initAuth: async () => {
    set({ isLoading: true });
    const user = await loadSession();
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  /** Login with email + password */
  login: async (email, password) => {
    set({ isLoading: true });
    const result = await loginUser(email, password);
    if (result.success) {
      set({ user: result.user, isAuthenticated: true, isLoading: false });
      return { success: true };
    }
    set({ isLoading: false });
    return { success: false, error: result.error };
  },

  /** Clear session and reset state */
  logout: async () => {
    await clearSession();
    set({ user: null, isAuthenticated: false });
  },
}));

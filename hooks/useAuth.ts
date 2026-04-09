"use client";

import { create } from "zustand";
import { loginUser, loadSession, clearSession } from "@/lib/auth";
import type { AuthState } from "@/types";

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  /** Called once on app mount to rehydrate session */
  initAuth: () => {
    const user = loadSession();
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  /** Login with email + password */
  login: async (email, password) => {
    const result = loginUser(email, password);
    if (result.success) {
      set({ user: result.user, isAuthenticated: true });
      return { success: true };
    }
    return { success: false, error: result.error };
  },

  /** Clear session and reset state */
  logout: () => {
    clearSession();
    set({ user: null, isAuthenticated: false });
  },
}));

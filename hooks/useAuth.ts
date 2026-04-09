"use client";

import { create } from "zustand";
import { loginUser, loginWithGoogle, loadSession, clearSession } from "@/lib/auth";
import type { AuthState, UserRole } from "@/types";

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  /** Rehydrate session from Supabase on mount */
  initAuth: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });
    const user = await loadSession();
    set({ user, isAuthenticated: !!user, isLoading: false, isInitialized: true });
  },

  /** Refresh user from Supabase (call after profile update) */
  refreshUser: async () => {
    const user = await loadSession();
    set({ user, isAuthenticated: !!user });
  },

  /** Email + password login */
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

  /** Google OAuth — redirects user, no return value */
  loginWithGoogle: async () => {
    return loginWithGoogle();
  },

  /** Sign out */
  logout: async () => {
    await clearSession();
    set({ user: null, isAuthenticated: false });
  },

  /** Convenience: check if current user has a specific role */
  hasRole: (role: UserRole) => {
    const { user } = get();
    return user?.roles?.includes(role) ?? false;
  },
}));

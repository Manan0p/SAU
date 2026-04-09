"use client";

import { create } from "zustand";
import { loginUser, loginStaffUser, loginAdminUser, loginWithGoogle, loadSession, clearSession } from "@/lib/auth";
import type { AuthState, UserRole } from "@/types";

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  /** Rehydrate session from Supabase on mount */
  initAuth: async (force = false) => {
    if (get().isInitialized && !force) return;
    set({ isLoading: true });
    const user = await loadSession();
    set({ user, isAuthenticated: !!user, isLoading: false, isInitialized: true });
  },

  /** Refresh user from Supabase (call after profile update) */
  refreshUser: async () => {
    const user = await loadSession();
    set({ user, isAuthenticated: !!user });
  },

  /** Student email + password login */
  login: async (email, password) => {
    set({ isLoading: true });
    const result = await loginUser(email, password);
    if (result.success) {
      set({ user: result.user, isAuthenticated: true, isLoading: false, isInitialized: true });
      return { success: true };
    }
    set({ isLoading: false });
    return { success: false, error: result.error };
  },

  /** Staff login — validates staff roles */
  loginStaff: async (email, password) => {
    set({ isLoading: true });
    const result = await loginStaffUser(email, password);
    if (result.success) {
      set({ user: result.user, isAuthenticated: true, isLoading: false, isInitialized: true });
      return { success: true };
    }
    set({ isLoading: false });
    return { success: false, error: result.error };
  },

  /** Admin login — validates admin role */
  loginAdmin: async (email, password) => {
    set({ isLoading: true });
    const result = await loginAdminUser(email, password);
    if (result.success) {
      set({ user: result.user, isAuthenticated: true, isLoading: false, isInitialized: true });
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
    set({ user: null, isAuthenticated: false, isInitialized: false });
  },

  /** Convenience: check if current user has a specific role */
  hasRole: (role: UserRole) => {
    const { user } = get();
    return user?.roles?.includes(role) ?? false;
  },
}));

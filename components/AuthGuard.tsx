"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  /** If provided, user must have at least one of these roles */
  requiredRoles?: UserRole[];
  /** Where to redirect if not authenticated */
  loginPath?: string;
}

export default function AuthGuard({ children, requiredRoles, loginPath = "/login" }: AuthGuardProps) {
  const { isAuthenticated, isLoading, isInitialized, initAuth, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) {
      initAuth();
    }
  }, [initAuth, isInitialized]);

  useEffect(() => {
    if (!isLoading && isInitialized) {
      if (!isAuthenticated) {
        router.replace(loginPath);
      } else if (requiredRoles && !requiredRoles.some((r) => hasRole(r))) {
        // Authenticated but wrong role
        router.replace(loginPath);
      }
    }
  }, [isLoading, isAuthenticated, isInitialized, router, requiredRoles, hasRole, loginPath]);

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Loading UniWell…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (requiredRoles && !requiredRoles.some((r) => hasRole(r))) return null;

  return <>{children}</>;
}

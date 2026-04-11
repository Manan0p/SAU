"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";
import OnboardingModal from "@/components/OnboardingModal";

interface AuthGuardProps {
  children: React.ReactNode;
  /** If provided, user must have at least one of these roles */
  requiredRoles?: UserRole[];
  /** Where to redirect if not authenticated */
  loginPath?: string;
}

export default function AuthGuard({ children, requiredRoles, loginPath = "/login" }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading, isInitialized, initAuth, hasRole } = useAuth();
  const router = useRouter();
  
  const [showOnboarding, setShowOnboarding] = useState(false);

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
      } else if (user) {
        // Check Onboarding status and trigger modal instead of redirecting
        const isProfileComplete = 
          !!user.phone && 
          !!user.college_id && 
          !!user.class && 
          !!user.branch && 
          !!user.batch && 
          !!user.blood_group;

        if (!isProfileComplete) {
           if (hasRole("student")) {
             setShowOnboarding(true);
           } else {
             if (localStorage.getItem("onboarding_skipped") !== "true") {
                setShowOnboarding(true);
             }
           }
        }
      }
    }
  }, [isLoading, isAuthenticated, isInitialized, router, requiredRoles, hasRole, loginPath, user]);

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f7f9fb" }}>
        <div className="flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}>
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-[#191c1e] font-bold text-sm">UniWell</p>
            <p className="text-[#727783] text-xs mt-0.5 font-medium">Verifying session…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (requiredRoles && !requiredRoles.some((r) => hasRole(r))) return null;

  return (
    <>
      {children}
      {showOnboarding && <OnboardingModal onComplete={() => setShowOnboarding(false)} />}
    </>
  );
}

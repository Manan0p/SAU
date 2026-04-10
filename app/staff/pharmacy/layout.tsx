"use client";
import AuthGuard from "@/components/AuthGuard";

export default function StaffPharmacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={["pharmacy", "admin"]} loginPath="/staff/login">
      {children}
    </AuthGuard>
  );
}

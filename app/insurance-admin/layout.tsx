"use client";
import AuthGuard from "@/components/AuthGuard";
import DynamicSidebar from "@/components/DynamicSidebar";

export default function InsuranceAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={["insurance", "admin"]} loginPath="/staff/login">
      <div className="flex min-h-screen">
        <DynamicSidebar />
        <main className="flex-1 ml-64 min-h-screen overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}

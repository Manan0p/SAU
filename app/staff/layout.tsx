"use client";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DynamicSidebar from "@/components/DynamicSidebar";

const STAFF_ROLES = ["doctor", "pharmacy", "insurance", "medical_center"] as const;

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/staff/login";

  if (isLoginPage) return <>{children}</>;

  return (
    <AuthGuard requiredRoles={[...STAFF_ROLES, "admin"]} loginPath="/staff/login">
      <div className="flex h-screen overflow-hidden">
        <DynamicSidebar />
        <main className="flex-1 ml-64 h-screen overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}

"use client";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) return <>{children}</>;

  return (
    <AuthGuard requiredRoles={["admin"]} loginPath="/admin/login">
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 ml-64 h-screen overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}

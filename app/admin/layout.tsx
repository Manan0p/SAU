"use client";
import AuthGuard from "@/components/AuthGuard";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={["admin"]} loginPath="/login">
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 ml-64 h-screen overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}

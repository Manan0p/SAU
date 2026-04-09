"use client";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}

"use client";

import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import DynamicSidebar from "@/components/DynamicSidebar";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard loginPath="/login">
      <div className="flex min-h-screen">
        <DynamicSidebar />
        <main className="flex-1 ml-64 min-h-screen overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}

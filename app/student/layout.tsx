"use client";

import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import AIChatbot from "@/components/AIChatbot";

/**
 * Layout for student pages.
 * Any authenticated user can access these routes — students are the primary
 * audience but admin/staff may visit for review purposes.
 * The Sidebar shown is always the student nav.
 */
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard loginPath="/login">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
          {children}
          <AIChatbot />
        </main>
      </div>
    </AuthGuard>
  );
}

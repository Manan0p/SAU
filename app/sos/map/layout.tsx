"use client";
import AuthGuard from "@/components/AuthGuard";
import DynamicSidebar from "@/components/DynamicSidebar";

/** Staff SOS Map — only accessible to doctor, medical_center, pharmacy, admin */
export default function SosMapLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRoles={["doctor", "medical_center", "pharmacy", "admin"]} loginPath="/login">
      <div className="flex min-h-screen">
        <DynamicSidebar />
        <main className="flex-1 ml-64 min-h-screen overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}

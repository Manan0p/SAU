"use client";

import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import StaffSidebar from "@/components/StaffSidebar";
import AdminSidebar from "@/components/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import AIChatbot from "@/components/AIChatbot";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { hasRole, isInitialized } = useAuth();

  // Helper to render the correct sidebar based on role
  const renderSidebar = () => {
    if (hasRole("admin")) return <AdminSidebar />;
    if (hasRole("doctor") || hasRole("pharmacy") || hasRole("insurance") || hasRole("medical_center")) {
      return <StaffSidebar />;
    }
    return <Sidebar />;
  };

  return (
    <AuthGuard loginPath="/login">
      <div className="flex min-h-screen bg-[#F7F9FB]">
        {renderSidebar()}
        <main className="flex-1 ml-64 min-h-screen overflow-y-auto bg-[#F7F9FB] relative">
          {children}
          <AIChatbot />
        </main>
      </div>
    </AuthGuard>
  );
}

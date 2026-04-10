"use client";

import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "./AdminSidebar";
import StaffSidebar from "./StaffSidebar";
import Sidebar from "./Sidebar";

export default function DynamicSidebar() {
  const { hasRole } = useAuth();
  
  if (hasRole("admin")) return <AdminSidebar />;
  if (hasRole("doctor") || hasRole("pharmacy") || hasRole("insurance") || hasRole("medical_center")) {
    return <StaffSidebar />;
  }
  
  return <Sidebar />;
}

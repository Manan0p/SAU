"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, CalendarDays, ShieldCheck, AlertTriangle, Activity,
  TrendingUp, CheckCircle, Clock, FileText, Pill,
  UserCog, RefreshCw, BarChart3, ChevronRight, Mail, UserCheck, Stethoscope, Map, ArrowRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, cn } from "@/lib/utils";

interface PlatformStats {
  totalUsers: number;
  students: number;
  staff: number;
  todayAppointments: number;
  totalAppointments: number;
  pendingClaims: number;
  approvedClaims: number;
  activeSos: number;
  resolvedSos: number;
  totalPrescriptions: number;
  lowStockItems: number;
}

interface RecentActivity {
  id: string;
  type: "appointment" | "claim" | "sos" | "user";
  title: string;
  subtitle: string;
  time: string;
  status?: string;
}

const ROLE_STYLES: Record<string, { bg: string, text: string, border: string, label: string }> = {
  student:        { bg: "bg-[#f5f3ff]", text: "text-[#7c3aed]", border: "border-[#ede9fe]", label: "Student" },
  doctor:         { bg: "bg-[#f0fdf4]", text: "text-[#16a34a]", border: "border-[#dcfce7]", label: "Doctor" },
  pharmacy:       { bg: "bg-[#ecfdf5]", text: "text-[#059669]", border: "border-[#d1fae5]", label: "Pharmacy" },
  admin:          { bg: "bg-[#fef2f2]", text: "text-[#dc2626]", border: "border-[#fee2e2]", label: "Admin" },
  insurance:      { bg: "bg-[#fffbeb]", text: "text-[#d97706]", border: "border-[#fef3c7]", label: "Insurance" },
  medical_center: { bg: "bg-[#eff6ff]", text: "text-[#2563eb]", border: "border-[#dbeafe]", label: "Center" },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0, students: 0, staff: 0,
    todayAppointments: 0, totalAppointments: 0,
    pendingClaims: 0, approvedClaims: 0,
    activeSos: 0, resolvedSos: 0,
    totalPrescriptions: 0, lowStockItems: 0,
  });
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { count: totalUsers },
        { data: profiles },
        { count: totalAppointments },
        { count: todayAppointments },
        { count: pendingClaims },
        { count: approvedClaims },
        { count: activeSos },
        { count: resolvedSos },
        { count: totalPrescriptions },
        { data: inventory },
        { data: recentAppointments },
        { data: recentClaims },
        { data: recentSos },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("roles"),
        supabase.from("appointments").select("*", { count: "exact", head: true }),
        supabase.from("appointments").select("*", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("claims").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("sos_requests").select("*", { count: "exact", head: true }).in("status", ["active", "responding"]),
        supabase.from("sos_requests").select("*", { count: "exact", head: true }).eq("status", "resolved"),
        supabase.from("prescriptions").select("*", { count: "exact", head: true }),
        supabase.from("pharmacy_inventory").select("id,quantity,threshold"),
        supabase.from("appointments").select("id,doctorName,status,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("claims").select("id,description,status,createdAt").order("createdAt", { ascending: false }).limit(5),
        supabase.from("sos_requests").select("id,userName,status,created_at").order("created_at", { ascending: false }).limit(3),
      ]);

      const students = (profiles ?? []).filter((p: {roles: string[]}) => p.roles?.includes("student")).length;
      const staff = (profiles ?? []).filter((p: {roles: string[]}) => !p.roles?.includes("student") && !p.roles?.includes("admin")).length;
      const lowStockItems = (inventory ?? []).filter((i: {quantity: number; threshold: number}) => i.quantity <= i.threshold).length;

      setStats({
        totalUsers: totalUsers ?? 0,
        students,
        staff,
        todayAppointments: todayAppointments ?? 0,
        totalAppointments: totalAppointments ?? 0,
        pendingClaims: pendingClaims ?? 0,
        approvedClaims: approvedClaims ?? 0,
        activeSos: activeSos ?? 0,
        resolvedSos: resolvedSos ?? 0,
        totalPrescriptions: totalPrescriptions ?? 0,
        lowStockItems,
      });

      const activityItems: RecentActivity[] = [
        ...(recentAppointments ?? []).map((a: Record<string, string>) => ({
          id: a.id,
          type: "appointment" as const,
          title: `Appointment for ${a.doctorName}`,
          subtitle: "Clinical scheduling",
          time: a.created_at,
          status: a.status,
        })),
        ...(recentClaims ?? []).map((c: Record<string, string>) => ({
          id: c.id,
          type: "claim" as const,
          title: c.description?.slice(0, 50) + (c.description?.length > 50 ? "…" : ""),
          subtitle: "Financial verification",
          time: c.createdAt,
          status: c.status,
        })),
        ...(recentSos ?? []).map((s: Record<string, string>) => ({
          id: s.id,
          type: "sos" as const,
          title: `SOS Emergency: ${s.userName}`,
          subtitle: "Immediate response",
          time: s.created_at,
          status: s.status,
        })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

      setActivity(activityItems);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const statCards = [
    { label: "Total Accounts",         value: stats.totalUsers,         icon: Users,         color: "#00478d", bg: "#d6e3ff", border: "#cae2fe" },
    { label: "Students",              value: stats.students,           icon: Users,         color: "#7c3aed", bg: "#f5f3ff", border: "#ede9fe" },
    { label: "Staff Pool",            value: stats.staff,              icon: UserCog,       color: "#059669", bg: "#ecfdf5", border: "#d1fae5" },
    { label: "Today appointments",    value: stats.todayAppointments,  icon: CalendarDays,  color: "#3b82f6", bg: "#eff6ff", border: "#dbeafe" },
    { label: "Pending Claims",        value: stats.pendingClaims,      icon: Clock,         color: "#d97706", bg: "#fffbeb", border: "#fef3c7" },
    { label: "Critical Stock",        value: stats.lowStockItems,      icon: AlertTriangle, color: "#ea580c", bg: "#fff7ed", border: "#ffedd5" },
    { label: "Emergency Alerts",      value: stats.activeSos,          icon: AlertTriangle, color: "#dc2626", bg: "#fef2f2", border: "#fee2e2" },
    { label: "Clinical Records",      value: stats.totalPrescriptions, icon: FileText,      color: "#4b5563", bg: "#f9fafb", border: "#f3f4f6" },
  ];

  const activityIcon = {
    appointment: CalendarDays,
    claim: ShieldCheck,
    sos: AlertTriangle,
    user: Users,
  };

  const activityIconBg = {
    appointment: "bg-blue-50 text-blue-600",
    claim: "bg-amber-50 text-amber-600",
    sos: "bg-red-50 text-red-600",
    user: "bg-purple-50 text-purple-600",
  };

  const statusVariantStyles = (s?: string) => {
     if (!s) return "bg-[#eceef0] text-[#727783] border-[#c2c6d4]";
     if (s === "approved" || s === "completed" || s === "resolved") return "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]";
     if (s === "rejected" || s === "cancelled") return "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]";
     if (s === "pending" || s === "active" || s === "booked") return "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]";
     return "bg-[#fcfdfe] text-[#727783] border-[#eceef0]";
  };

  return (
    <div className="min-h-screen pb-20 p-10 max-w-7xl mx-auto space-y-10" style={{ background: "#f7f9fb" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#00478d] text-white shadow-xl shadow-[#00478d]/20 transition-transform hover:scale-105 duration-300">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>
               UniWell Intelligence
            </h1>
            <p className="text-[#727783] font-semibold mt-1 flex items-center gap-2">
               Centralized Portal Oversight · <span className="text-[#00478d] font-bold">Authorized Admin: {user?.name}</span>
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2 bg-white border-[#eceef0] hover:bg-[#f2f4f6]" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Sync Intelligence
        </Button>
      </div>

      {/* Extreme Priority Header (Active SOS) */}
      {stats.activeSos > 0 && (
        <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-[#ba1a1a] text-white shadow-2xl shadow-[#ba1a1a]/20 animate-in slide-in-from-top-4 duration-700">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
             <h4 className="text-xl font-black uppercase tracking-widest leading-none">Emergency Protocol Active</h4>
             <p className="text-white/80 font-bold mt-1 uppercase text-[10px] tracking-widest leading-none opacity-80">{stats.activeSos} UNRESOLVED SOS ALERTS DETECTED</p>
          </div>
          <Button asChild className="bg-white text-[#ba1a1a] hover:bg-white/90 font-black rounded-xl px-8 h-12 shadow-lg">
             <a href="/sos/map">DEPLOY RESPONSE</a>
          </Button>
        </div>
      )}

      {/* Stats Cluster */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="bg-white rounded-3xl p-6 border border-[#eceef0] shadow-[0_4px_20px_rgba(25,28,30,0.04)] group hover:shadow-xl transition-all duration-300">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 border group-hover:scale-110 transition-transform" style={{ background: bg, borderColor: border }}>
              <Icon className="w-5 h-5" style={{ color: color }} />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-[#727783] mb-1">{label}</p>
            <p className="text-3xl font-black text-[#191c1e] leading-none" style={{ fontFamily: 'var(--font-manrope)' }}>
              {loading ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Activity Stream */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_4px_24px_rgba(25,28,30,0.06)] border border-[#eceef0]">
              <div className="flex items-center justify-between mb-8 px-2">
                 <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[#00478d]" />
                    <h3 className="text-xl font-extrabold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>Operational Stream</h3>
                 </div>
                 <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest py-1 border-[#eceef0]">Live Feed</Badge>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-[#005eb8] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#c2c6d4]">Gathering data...</p>
                </div>
              ) : activity.length === 0 ? (
                <div className="py-20 text-center bg-[#fcfdfe] rounded-3xl border border-dashed border-[#eceef0]">
                   <Activity className="w-10 h-10 text-[#c2c6d4] mx-auto mb-3" />
                   <p className="text-[#727783] text-sm font-bold">No active events recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activity.map((item) => {
                    const Icon = activityIcon[item.type];
                    return (
                      <div key={item.id} className="flex items-center gap-5 p-5 rounded-2xl bg-[#fcfdfe] border border-[#eceef0] hover:border-[#cae2fe] hover:bg-[#f7f9fb] transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-white border border-[#eceef0] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform text-[#00478d]">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#727783] mb-1 opacity-70">{item.subtitle}</p>
                          <p className="text-base font-bold text-[#191c1e] truncate">{item.title}</p>
                          <p className="text-[11px] font-bold text-[#c2c6d4] mt-1">{formatDate(item.time)}</p>
                        </div>
                        {item.status && (
                          <div className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", statusVariantStyles(item.status))}>
                            {item.status}
                          </div>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#c2c6d4] group-hover:text-[#00478d]" />
                      </div>
                    );
                  })}
                </div>
              )}
           </div>
        </div>

        {/* Global Controls */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-[#191c1e] rounded-[2.5rem] p-8 shadow-2xl border border-black/10 text-white">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ fontFamily: 'var(--font-manrope)' }}>
                 <TrendingUp className="w-5 h-5 text-[#cae2fe]" />
                 Portal Access
              </h3>
              <div className="space-y-3">
                 {[
                   { href: "/admin/users",      label: "User Registry",    icon: Users,        color: "#cae2fe" },
                   { href: "/insurance-admin",  label: "Claims Review",    icon: ShieldCheck,  color: "#ffd68a" },
                   { href: "/medical-records",  label: "Clinical Records", icon: Stethoscope,  color: "#cae2fe" },
                   { href: "/staff/pharmacy",   label: "Pharmacy Panel",   icon: Pill,         color: "#b9f8d3" },
                   { href: "/sos/map",          label: "SOS Command",      icon: AlertTriangle, color: "#ffdad6" },
                 ].map(({ href, label, icon: Icon, color }) => (
                   <a key={label} href={href} className="flex items-center gap-5 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
                      <Icon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" style={{ color }} />
                      <span className="text-sm font-bold text-white/90 group-hover:text-white">{label}</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-white/40 group-hover:text-white" />
                   </a>
                 ))}
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">Core Infrastructure</p>
                 <Badge className="bg-[#ffd68a] text-[#191c1e] hover:bg-[#ffd68a] border-none font-black text-[9px] tracking-widest px-4">SECURE SESSION</Badge>
              </div>
           </div>
        </div>
      </div>

      {/* Embedded Modern User Panel */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_4px_24px_rgba(25,28,30,0.06)] border border-[#eceef0]">
         <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
               <UserCog className="w-6 h-6 text-[#00478d]" />
               <h3 className="text-xl font-extrabold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>Registrar's View</h3>
            </div>
            <Button variant="ghost" asChild className="text-[#005eb8] font-black uppercase text-[10px] tracking-widest hover:bg-[#d6e3ff]/30">
               <a href="/admin/users">Full Directory <ArrowRight className="w-3.5 h-3.5 ml-2" /></a>
            </Button>
         </div>
         <UserManagementPanel />
      </div>
    </div>
  );
}

function UserManagementPanel() {
  const [users, setUsers] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  
  useEffect(() => {
    supabase.from("profiles").select("id,name,email,roles,college_id,created_at").order("created_at", { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setUsers(data); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 border-4 border-[#005eb8] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => (
          <div key={u.id} className="p-6 rounded-3xl bg-[#fcfdfe] border border-[#eceef0] hover:border-[#cae2fe] hover:bg-white hover:shadow-lg transition-all group relative overflow-hidden">
             <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#00478d] text-base font-black border border-[#eceef0] group-hover:bg-[#d6e3ff] transition-colors">
                  {String(u.name || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[9px] font-black uppercase tracking-widest text-[#c2c6d4] opacity-80 mb-0.5">{u.college_id || "GUEST ACCOUNT"}</p>
                   <p className="text-sm font-black text-[#191c1e] truncate pr-4">{u.name}</p>
                   <p className="text-[11px] font-bold text-[#727783] truncate mt-0.5">{u.email}</p>
                </div>
             </div>
             <div className="mt-5 flex flex-wrap gap-2">
                {(u.roles || []).map((r: string) => {
                  const style = ROLE_STYLES[r] || { bg: "bg-[#f2f4f6]", text: "text-[#727783]", border: "border-[#eceef0]", label: r };
                  return (
                    <span key={r} className={cn("text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", style.bg, style.text, style.border)}>
                      {style.label}
                    </span>
                  );
                })}
             </div>
             {u.id === currentUser?.id && (
               <div className="absolute top-4 right-4 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-[#16a34a] shadow-[0_0_8px_rgba(22,163,74,0.5)]" />
               </div>
             )}
          </div>
        ))}
      </div>
      <p className="text-[9px] font-black text-[#c2c6d4] text-center mt-8 uppercase tracking-[0.4em]">Proprietary Administrative Engine</p>
    </div>
  );
}

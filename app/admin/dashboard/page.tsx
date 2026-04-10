"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, CalendarDays, ShieldCheck, AlertTriangle, Activity,
  TrendingUp, CheckCircle, Clock, FileText, Pill,
  UserCog, RefreshCw, BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

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
          title: `Appointment with ${a.doctorName}`,
          subtitle: "Patient appointment",
          time: a.created_at,
          status: a.status,
        })),
        ...(recentClaims ?? []).map((c: Record<string, string>) => ({
          id: c.id,
          type: "claim" as const,
          title: c.description?.slice(0, 50) + (c.description?.length > 50 ? "…" : ""),
          subtitle: "Insurance claim",
          time: c.createdAt,
          status: c.status,
        })),
        ...(recentSos ?? []).map((s: Record<string, string>) => ({
          id: s.id,
          type: "sos" as const,
          title: `SOS by ${s.userName}`,
          subtitle: "Emergency alert",
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
    { label: "Total Users",           value: stats.totalUsers,         icon: Users,         color: "text-violet-400",  border: "border-violet-500/20", bg: "bg-violet-500/10" },
    { label: "Students",              value: stats.students,           icon: Users,         color: "text-fuchsia-400", border: "border-fuchsia-500/20", bg: "bg-fuchsia-500/10" },
    { label: "Staff Members",         value: stats.staff,              icon: UserCog,       color: "text-violet-400",  border: "border-violet-500/20", bg: "bg-violet-500/10" },
    { label: "Appointments Today",    value: stats.todayAppointments,  icon: CalendarDays,  color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10" },
    { label: "Total Appointments",    value: stats.totalAppointments,  icon: Activity,      color: "text-violet-400",  border: "border-violet-500/20", bg: "bg-violet-500/10" },
    { label: "Pending Claims",        value: stats.pendingClaims,      icon: Clock,         color: "text-amber-400",   border: "border-amber-500/20",  bg: "bg-amber-500/10" },
    { label: "Approved Claims",       value: stats.approvedClaims,     icon: CheckCircle,   color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10" },
    { label: "Active SOS",            value: stats.activeSos,          icon: AlertTriangle, color: "text-red-400",     border: "border-red-500/20",    bg: "bg-red-500/10" },
    { label: "Resolved SOS",          value: stats.resolvedSos,        icon: ShieldCheck,   color: "text-violet-400",  border: "border-violet-500/20", bg: "bg-violet-500/10" },
    { label: "Prescriptions Issued",  value: stats.totalPrescriptions, icon: Pill,          color: "text-violet-400",  border: "border-violet-500/20", bg: "bg-violet-500/10" },
    { label: "Low Stock Medicines",   value: stats.lowStockItems,      icon: AlertTriangle, color: "text-red-400",     border: "border-red-500/20",    bg: "bg-red-500/10" },
    { label: "Audit Logs",            value: "—",                      icon: FileText,       color: "text-slate-400",   border: "border-white/10",      bg: "bg-white/5" },
  ];

  const activityIcon = {
    appointment: CalendarDays,
    claim: ShieldCheck,
    sos: AlertTriangle,
    user: Users,
  };

  const activityColor = {
    appointment: "text-violet-400",
    claim: "text-amber-400",
    sos: "text-red-400",
    user: "text-fuchsia-400",
  };

  const statusVariant = (s?: string) => {
    if (!s) return "secondary";
    if (s === "approved" || s === "completed" || s === "resolved") return "success";
    if (s === "rejected" || s === "cancelled") return "destructive";
    if (s === "pending" || s === "active") return "warning";
    return "secondary";
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-violet-400" />
            Platform Overview
          </h1>
          <p className="text-slate-400">
            Admin Control Panel · Welcome, <span className="text-white font-medium">{user?.name}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Active SOS Banner */}
      {stats.activeSos > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-300 font-medium">
            ⚠️ {stats.activeSos} active SOS alert{stats.activeSos > 1 ? "s" : ""} — immediate attention required!
          </p>
          <a href="/sos/map" className="ml-auto text-xs text-red-400 hover:text-red-300 underline">View Map →</a>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, border, bg }) => (
          <Card key={label} className={`border ${border} hover:border-white/20 transition-all`}>
            <CardContent className="p-5">
              <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{loading ? "—" : value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { href: "/admin/dashboard", label: "User Management", icon: Users, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
              { href: "/admin/dashboard", label: "Audit Logs",       icon: FileText, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/20" },
              { href: "/insurance-admin", label: "Review Claims",    icon: ShieldCheck, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
              { href: "/sos/map",         label: "SOS Map",          icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
              { href: "/staff/pharmacy",  label: "Pharmacy",         icon: Pill, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            ].map(({ href, label, icon: Icon, color, bg }) => (
              <a key={label} href={href} className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:brightness-110 ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-white font-medium">{label}</span>
              </a>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-400" />
              Recent Platform Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activity.length === 0 ? (
              <div className="py-8 text-center">
                <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((item) => {
                  const Icon = activityIcon[item.type];
                  const color = activityColor[item.type];
                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.subtitle} · {formatDate(item.time)}</p>
                      </div>
                      {item.status && (
                        <Badge variant={statusVariant(item.status) as "success" | "destructive" | "warning" | "secondary" | "default"} className="text-xs shrink-0">
                          {item.status}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Management Panel (inlined from original dashboard) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCog className="w-4 h-4 text-violet-400" />
              User Management
            </CardTitle>
            <a href="/admin/dashboard" className="text-xs text-violet-400 hover:text-violet-300">Full panel →</a>
          </div>
        </CardHeader>
        <CardContent>
          <UserManagementPanel />
        </CardContent>
      </Card>
    </div>
  );
}

function UserManagementPanel() {
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  type UserRole = "student" | "doctor" | "pharmacy" | "admin" | "insurance" | "medical_center";
  const ALL_ROLES: UserRole[] = ["student", "doctor", "pharmacy", "admin", "insurance", "medical_center"];
  const ROLE_COLORS: Record<UserRole, string> = {
    student: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
    doctor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    pharmacy: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    admin: "bg-red-500/20 text-red-400 border-red-500/30",
    insurance: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    medical_center: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  };

  useEffect(() => {
    supabase.from("profiles").select("id,name,email,roles,college_id,created_at").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setUsers(data); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div key={String(u.id)} className={`flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border ${String(u.id) === currentUser?.id ? "border-violet-500/30" : "border-white/5"}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {String(u.name ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{String(u.name)}</p>
            <p className="text-xs text-slate-500 truncate">{String(u.email)}</p>
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {((u.roles as UserRole[]) ?? []).map((r: UserRole) => (
              <span key={r} className={`text-xs px-1.5 py-0.5 rounded border ${ROLE_COLORS[r] ?? ""}`}>{r}</span>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-slate-600 text-center pt-1">Showing latest 10 users · Full management panel coming soon</p>
    </div>
  );
}

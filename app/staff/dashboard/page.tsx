"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays, FileSearch, Pill, ShieldCheck, Map, AlertTriangle,
  Clock, CheckCircle, XCircle, Package, TrendingUp, Users, RefreshCw, Stethoscope,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAllAppointments, updateAppointmentStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDateTime, formatDate } from "@/lib/utils";
import type { Appointment } from "@/types";

// ─── Doctor Dashboard ───────────────────────────────────────────────────────
function DoctorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllAppointments();
    // Filter to this doctor's appointments (by doctorId matching user id, or doctorName matching)
    const mine = all.filter(
      (a) => a.doctorId === user?.id || a.doctorName === user?.name
    );
    setAppointments(mine);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);


  const upcoming = appointments.filter((a) => a.status === "booked" && new Date(a.timeSlot) >= new Date());
  const today = appointments.filter((a) => formatDate(a.timeSlot) === formatDate(new Date().toISOString()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Doctor Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your appointments and patient records</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: CalendarDays, label: "Today's Appointments", value: today.length, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
          { icon: Clock, label: "Pending Confirmation", value: upcoming.length, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { icon: CheckCircle, label: "Completed Total", value: appointments.filter((a) => a.status === "completed").length, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-6 ${bg}`}>
            <Icon className={`w-8 h-8 ${color} mb-3`} />
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Appointments Preview */}
      <Card>
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="w-5 h-5 text-violet-400" />
              Upcoming Appointments
            </CardTitle>
            <Button variant="outline" size="sm" asChild className="text-xs">
              <a href="/staff/appointments">View All Configs</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-slate-400 text-sm">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((appt) => (
                <div key={appt.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{appt.specialty}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(appt.timeSlot)}</p>
                    </div>
                  </div>
                  <Badge variant="warning" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>
                </div>
              ))}
              {upcoming.length > 3 && (
                <a href="/staff/appointments" className="block text-center text-sm text-violet-400 hover:text-violet-300 py-2 mt-2">
                  + {upcoming.length - 3} more upcoming
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-violet-400" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <a href="/medical-records" className="flex items-center gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
            <FileSearch className="w-5 h-5 text-violet-400" />
            <span className="text-sm text-white font-medium">Patient Records</span>
          </a>
          <a href="/sos/map" className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
            <Map className="w-5 h-5 text-red-400" />
            <span className="text-sm text-white font-medium">SOS Emergency Map</span>
          </a>
        </div>
      </div>


    </div>
  );
}

// ─── Pharmacy Dashboard ─────────────────────────────────────────────────────
function PharmacyDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pharmacy Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Monitor inventory and dispense prescriptions</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Pill, label: "Inventory Items", value: "—", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { icon: Clock, label: "Pending Prescriptions", value: "—", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { icon: AlertTriangle, label: "Low Stock Alerts", value: "—", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-6 ${bg}`}>
            <Icon className={`w-8 h-8 ${color} mb-3`} />
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Pill className="w-5 h-5 text-emerald-400" /> Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <a href="/staff/pharmacy" className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            <Package className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-white font-medium">Inventory & Prescriptions</span>
          </a>
          <a href="/staff/pharmacy" className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-white font-medium">Student Orders</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Insurance Dashboard ────────────────────────────────────────────────────
function InsuranceDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Insurance Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Review and process insurance claims</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, label: "Pending Claims", value: "—", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { icon: TrendingUp, label: "Approved This Month", value: "—", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { icon: Users, label: "Active Students", value: "—", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-6 ${bg}`}>
            <Icon className={`w-8 h-8 ${color} mb-3`} />
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-amber-400" /> Quick Actions</h2>
        <a href="/insurance-admin" className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="text-sm text-white font-medium">Review All Claims</span>
        </a>
      </div>
    </div>
  );
}

// ─── Medical Center Dashboard ────────────────────────────────────────────────
function MedicalCenterDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Medical Center Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Monitor emergencies and medical records</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: AlertTriangle, label: "Active SOS", value: "—", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
          { icon: FileSearch, label: "Records Today", value: "—", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-6 ${bg}`}>
            <Icon className={`w-8 h-8 ${color} mb-3`} />
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <a href="/sos/map" className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
          <Map className="w-5 h-5 text-red-400" />
          <span className="text-sm text-white font-medium">SOS Map</span>
        </a>
        <a href="/medical-records" className="flex items-center gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
          <FileSearch className="w-5 h-5 text-violet-400" />
          <span className="text-sm text-white font-medium">Medical Records</span>
        </a>
      </div>
    </div>
  );
}

// ─── Root Component ──────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const { hasRole, user } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const renderDashboard = () => {
    if (hasRole("doctor")) return <DoctorDashboard />;
    if (hasRole("pharmacy")) return <PharmacyDashboard />;
    if (hasRole("insurance")) return <InsuranceDashboard />;
    if (hasRole("medical_center")) return <MedicalCenterDashboard />;
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-white font-semibold">No staff role assigned</p>
          <p className="text-slate-400 text-sm mt-1">Contact your administrator to be assigned a role.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-slate-400 text-sm">{greeting},</p>
        <h1 className="text-3xl font-bold text-white">{user?.name ?? "Staff Member"} 👋</h1>
      </div>
      {renderDashboard()}
    </div>
  );
}

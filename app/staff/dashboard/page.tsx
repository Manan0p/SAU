"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, FileSearch, Pill, ShieldCheck, Map, AlertTriangle,
  Clock, CheckCircle, XCircle, Package, TrendingUp, Users, RefreshCw, Stethoscope, ChevronRight, ArrowRight, Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAllAppointments, updateAppointmentStatus } from "@/lib/api";
import { useSosMonitor } from "@/hooks/useSos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDateTime, formatDate, cn } from "@/lib/utils";
import type { Appointment } from "@/types";

// ─── Doctor Dashboard ───────────────────────────────────────────────────────
function DoctorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeSosRequests } = useSosMonitor();

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
  const todayAppts = appointments.filter((a) => formatDate(a.timeSlot) === formatDate(new Date().toISOString()));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#d6e3ff] text-[#00478d]">
              <Stethoscope className="w-6 h-6" />
           </div>
           <div>
              <h1 className="text-2xl font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>Doctor Panel</h1>
              <p className="text-[#727783] text-sm font-medium">Manage your patient schedule and clinical records</p>
           </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2 bg-white border-[#eceef0] hover:bg-[#f2f4f6]" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: CalendarDays, label: "Today's Schedule", value: todayAppts.length, color: "#00478d", bg: "#d6e3ff", border: "#cae2fe" },
          { icon: Clock, label: "Pending Confirmation", value: upcoming.length, color: "#d97706", bg: "#fffbeb", border: "#fef3c7" },
          { icon: CheckCircle, label: "Patients Treated", value: appointments.filter((a) => a.status === "completed").length, color: "#16a34a", bg: "#f0fdf4", border: "#dcfce7" },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} className="bg-white rounded-3xl p-6 border border-[#eceef0] shadow-[0_2px_12px_rgba(25,28,30,0.04)]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border" style={{ background: bg, borderColor: border }}>
              <Icon className="w-5 h-5" style={{ color: color }} />
            </div>
            <p className="text-[#727783] text-xs font-bold uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-bold text-[#191c1e] mt-1" style={{ fontFamily: 'var(--font-manrope)' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments Preview */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#191c1e] flex items-center gap-2" style={{ fontFamily: 'var(--font-manrope)' }}>
                <CalendarDays className="w-5 h-5 text-[#00478d]" />
                Upcoming Consultations
              </h3>
              <Button variant="ghost" size="sm" asChild className="text-[#005eb8] font-bold hover:bg-[#d6e3ff]/30 h-8">
                <a href="/staff/appointments">View Full Schedule</a>
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-[#005eb8] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : upcoming.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#f2f4f6] flex items-center justify-center mb-3">
                   <Clock className="w-6 h-6 text-[#c2c6d4]" />
                </div>
                <p className="text-[#727783] text-sm font-medium">No consultations scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcoming.slice(0, 4).map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#f7f9fb] border border-[#eceef0] hover:border-[#cae2fe] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#00478d] border border-[#eceef0] group-hover:bg-[#d6e3ff]/50 transition-colors shadow-sm">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#191c1e]">{appt.specialty}</p>
                        <p className="text-xs font-semibold text-[#727783] mt-0.5">{formatDateTime(appt.timeSlot)}</p>
                      </div>
                    </div>
                    <Badge variant="warning" className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 bg-[#fffbeb] text-[#d97706] border-[#fef3c7]">Pending</Badge>
                  </div>
                ))}
                {upcoming.length > 4 && (
                  <a href="/staff/appointments" className="flex items-center justify-center gap-2 text-sm font-bold text-[#005eb8] hover:underline pt-2">
                    View {upcoming.length - 4} more appointments <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1 bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0]">
            <h3 className="text-lg font-bold text-[#191c1e] mb-6 flex items-center gap-2" style={{ fontFamily: 'var(--font-manrope)' }}>
              <TrendingUp className="w-5 h-5 text-[#00478d]" />
              Clinical Actions
            </h3>
            <div className="space-y-3">
              <a href="/medical-records" className="flex items-center gap-4 p-4 rounded-2xl bg-[#f7f9fb] border border-[#eceef0] hover:border-[#cae2fe] hover:bg-white transition-all group">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#00478d] border border-[#eceef0] group-hover:bg-[#d6e3ff] group-hover:text-[#00478d] transition-all">
                  <FileSearch className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold text-[#424752] group-hover:text-[#191c1e]">Patient Records</span>
                <ChevronRight className="w-4 h-4 ml-auto text-[#c2c6d4]" />
              </a>
              <a href="/sos/map" className="flex items-center justify-between p-4 rounded-2xl bg-[#fef2f2] border border-[#fee2e2] hover:bg-[#ffdad6] transition-all group cursor-pointer block w-full">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#dc2626] border border-[#fee2e2] group-hover:text-[#dc2626] transition-all shadow-sm">
                    <Map className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#424752] group-hover:text-[#191c1e] block">Live SOS Emergency Map</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#dc2626]">{activeSosRequests.length} Active Alerts</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#dc2626]/50 group-hover:text-[#dc2626]" />
              </a>
            </div>
          </div>
      </div>
    </div>
  );
}

// ─── Pharmacy Dashboard ─────────────────────────────────────────────────────
function PharmacyDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#f0fdf4] text-[#16a34a]">
              <Pill className="w-6 h-6" />
           </div>
           <div>
              <h1 className="text-2xl font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>Pharmacy Hub</h1>
              <p className="text-[#727783] text-sm font-medium">Monitor medicinal inventory and dispense student prescriptions</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Pill, label: "Stock Items", value: "—", color: "#16a34a", bg: "#f0fdf4", border: "#dcfce7" },
          { icon: Clock, label: "Awaiting Fill", value: "—", color: "#d97706", bg: "#fffbeb", border: "#fef3c7" },
          { icon: AlertTriangle, label: "Critically Low", value: "—", color: "#dc2626", bg: "#fef2f2", border: "#fee2e2" },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} className="bg-white rounded-3xl p-6 border border-[#eceef0] shadow-[0_2px_12px_rgba(25,28,30,0.04)]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border" style={{ background: bg, borderColor: border }}>
              <Icon className="w-5 h-5" style={{ color: color }} />
            </div>
            <p className="text-[#727783] text-xs font-bold uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-bold text-[#191c1e] mt-1" style={{ fontFamily: 'var(--font-manrope)' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0]">
        <h3 className="text-lg font-bold text-[#191c1e] mb-6 flex items-center gap-2" style={{ fontFamily: 'var(--font-manrope)' }}>
          <Package className="w-5 h-5 text-[#16a34a]" />
          Pharmacy Operations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/staff/pharmacy" className="flex items-center gap-5 p-5 rounded-2xl bg-[#f7f9fb] border border-[#eceef0] hover:border-[#cae2fe] hover:bg-white transition-all group">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#16a34a] border border-[#eceef0] group-hover:bg-[#f0fdf4] transition-all">
              <Package className="w-6 h-6" />
            </div>
            <div>
               <p className="text-base font-bold text-[#191c1e]">Inventory Management</p>
               <p className="text-xs font-medium text-[#727783] mt-0.5">Update counts & audit medicines</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto text-[#c2c6d4]" />
          </a>
          <a href="/staff/pharmacy" className="flex items-center gap-5 p-5 rounded-2xl bg-[#f7f9fb] border border-[#eceef0] hover:border-[#cae2fe] hover:bg-white transition-all group">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#d97706] border border-[#eceef0] group-hover:bg-[#fffbeb] transition-all">
              <Clock className="w-6 h-6" />
            </div>
            <div>
               <p className="text-base font-bold text-[#191c1e]">Active Prescriptions</p>
               <p className="text-xs font-medium text-[#727783] mt-0.5">Review and fulfill active orders</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto text-[#c2c6d4]" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Insurance Dashboard ────────────────────────────────────────────────────
function InsuranceDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#fffbeb] text-[#d97706]">
              <ShieldCheck className="w-6 h-6" />
           </div>
           <div>
              <h1 className="text-2xl font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>Insurance Desk</h1>
              <p className="text-[#727783] text-sm font-medium">Process and verify student healthcare claims efficiently</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: ShieldCheck, label: "Awaiting Review", value: "—", color: "#d97706", bg: "#fffbeb", border: "#fef3c7" },
          { icon: TrendingUp, label: "Approved (Monthly)", value: "—", color: "#16a34a", bg: "#f0fdf4", border: "#dcfce7" },
          { icon: Users, label: "Enrolled Students", value: "—", color: "#00478d", bg: "#d6e3ff", border: "#cae2fe" },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} className="bg-white rounded-3xl p-6 border border-[#eceef0] shadow-[0_2px_12px_rgba(25,28,30,0.04)]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border" style={{ background: bg, borderColor: border }}>
              <Icon className="w-5 h-5" style={{ color: color }} />
            </div>
            <p className="text-[#727783] text-xs font-bold uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-bold text-[#191c1e] mt-1" style={{ fontFamily: 'var(--font-manrope)' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0]">
        <h3 className="text-lg font-bold text-[#191c1e] mb-6 flex items-center gap-2" style={{ fontFamily: 'var(--font-manrope)' }}>
          <ShieldCheck className="w-5 h-5 text-[#d97706]" />
          Claim Administration
        </h3>
        <a href="/insurance-admin" className="flex items-center gap-5 p-6 rounded-2xl bg-[#f7f9fb] border border-[#eceef0] hover:border-[#cae2fe] hover:bg-white transition-all group">
          <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-[#d97706] border border-[#eceef0] group-hover:bg-[#fffbeb] transition-all shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
             <p className="text-lg font-bold text-[#191c1e]">Open Verification Queue</p>
             <p className="text-sm font-medium text-[#727783] mt-0.5">Examine bill attachments and approve claims for payout</p>
          </div>
          <ChevronRight className="w-6 h-6 ml-auto text-[#c2c6d4]" />
        </a>
      </div>
    </div>
  );
}

// ─── Medical Center Dashboard ────────────────────────────────────────────────
function MedicalCenterDashboard() {
  const { activeSosRequests } = useSosMonitor();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#eff6ff] text-[#3b82f6]">
              <Activity className="w-6 h-6" />
           </div>
           <div>
              <h1 className="text-2xl font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>Center Command</h1>
              <p className="text-[#727783] text-sm font-medium">Real-time emergency monitoring and health system status</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { icon: AlertTriangle, label: "Active SOS Emergencies", value: activeSosRequests.length.toString(), color: "#dc2626", bg: "#fef2f2", border: "#fee2e2" },
          { icon: FileSearch, label: "New Records (24h)", value: "—", color: "#3b82f6", bg: "#eff6ff", border: "#dbeafe" },
        ].map(({ icon: Icon, label, value, color, bg, border }) => (
          <div key={label} className="bg-white rounded-3xl p-8 border border-[#eceef0] shadow-[0_2px_12px_rgba(25,28,30,0.04)]">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border" style={{ background: bg, borderColor: border }}>
              <Icon className="w-6 h-6" style={{ color: color }} />
            </div>
            <p className="text-[#727783] text-sm font-bold uppercase tracking-widest">{label}</p>
            <p className="text-4xl font-bold text-[#191c1e] mt-2" style={{ fontFamily: 'var(--font-manrope)' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/sos/map" className="flex items-center gap-5 p-6 rounded-3xl bg-white border border-[#eceef0] hover:border-[#ffdad6] hover:bg-[#ffdad6]/10 transition-all group shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#fef2f2] flex items-center justify-center text-[#dc2626] border border-[#fee2e2] group-hover:scale-110 transition-transform">
            <Map className="w-7 h-7" />
          </div>
          <div>
            <span className="text-lg font-bold text-[#191c1e] block">Incident Map</span>
            <span className="text-xs font-semibold text-[#727783] uppercase tracking-wider">Locate Distress Alerts</span>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto text-[#c2c6d4]" />
        </a>
        <a href="/medical-records" className="flex items-center gap-5 p-6 rounded-3xl bg-white border border-[#eceef0] hover:border-[#cae2fe] hover:bg-[#eff6ff]/10 transition-all group shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#eff6ff] flex items-center justify-center text-[#3b82f6] border border-[#dbeafe] group-hover:scale-110 transition-transform">
            <FileSearch className="w-7 h-7" />
          </div>
          <div>
            <span className="text-lg font-bold text-[#191c1e] block">Master Records</span>
            <span className="text-xs font-semibold text-[#727783] uppercase tracking-wider">Historical Patient Data</span>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto text-[#c2c6d4]" />
        </a>
      </div>
    </div>
  );
}

// ─── Root Component ──────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const { hasRole, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hasRole("insurance")) {
      router.replace("/insurance-admin");
      return;
    }
    if (hasRole("medical_center")) {
      router.replace("/sos/map");
    }
  }, [hasRole, router]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";

  if (hasRole("insurance") || hasRole("medical_center")) {
    return null;
  }

  const renderDashboard = () => {
    if (hasRole("doctor")) return <DoctorDashboard />;
    if (hasRole("pharmacy")) return <PharmacyDashboard />;
    if (hasRole("insurance")) return <InsuranceDashboard />;
    if (hasRole("medical_center")) return <MedicalCenterDashboard />;
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl border border-[#eceef0] shadow-sm">
        <div className="w-20 h-20 rounded-full bg-[#fffbeb] border border-[#fef3c7] flex items-center justify-center mb-6">
           <AlertTriangle className="w-10 h-10 text-[#d97706]" />
        </div>
        <h3 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>No Staff Role Assigned</h3>
        <p className="text-[#727783] text-sm mt-2 max-w-sm text-center">Your account is active, but hasn't been linked to a specific clinical department. Please contact platform administration.</p>
        <Button variant="outline" className="mt-8 border-[#eceef0] text-[#005eb8] font-bold" onClick={() => window.location.reload()}>
           Request Access Refresh
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-10 max-w-7xl mx-auto" style={{ background: "#f7f9fb" }}>
      <div className="mb-12">
        <p className="text-[#727783] font-bold text-xs uppercase tracking-widest mb-1">{greeting}</p>
        <h1 className="text-4xl font-bold text-[#191c1e] flex items-center gap-3" style={{ fontFamily: 'var(--font-manrope)' }}>
          {user?.name ?? "Staff Member"} <span className="text-3xl">👋</span>
        </h1>
      </div>
      {renderDashboard()}
    </div>
  );
}

"use client";

import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, FileSearch, Pill, ShieldCheck, Map, AlertTriangle, TrendingUp, Users, Clock } from "lucide-react";

function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Doctor Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your appointments and patient records</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: CalendarDays, label: "Today's Appointments", value: "—", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { icon: FileSearch, label: "Medical Records", value: "—", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
          { icon: AlertTriangle, label: "Active SOS Alerts", value: "—", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-6 ${bg}`}>
            <Icon className={`w-8 h-8 ${color} mb-3`} />
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-blue-400" /> Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <a href="/appointments" className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
            <CalendarDays className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-white font-medium">View Appointments</span>
          </a>
          <a href="/medical-records" className="flex items-center gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
            <FileSearch className="w-5 h-5 text-violet-400" />
            <span className="text-sm text-white font-medium">Patient Records</span>
          </a>
          <a href="/sos/map" className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors col-span-2">
            <Map className="w-5 h-5 text-red-400" />
            <span className="text-sm text-white font-medium">SOS Emergency Map</span>
          </a>
        </div>
      </div>
    </div>
  );
}

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
          <a href="/pharmacy" className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            <Pill className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-white font-medium">Manage Inventory</span>
          </a>
          <a href="/staff/prescriptions" className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-white font-medium">Pending Prescriptions</span>
          </a>
        </div>
      </div>
    </div>
  );
}

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
          { icon: Users, label: "Active Students", value: "—", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
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

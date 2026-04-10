"use client";

import { FileText, Shield, Clock, ShieldCheck, Activity, ArrowRight, Fingerprint, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminAuditPage() {
  return (
    <div className="min-h-screen pb-20 p-10 max-w-7xl mx-auto space-y-10" style={{ background: "#f7f9fb" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#00478d] text-white shadow-xl shadow-[#00478d]/20 transition-transform hover:scale-105 duration-300">
              <Activity className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Clinical Audit Trail</h1>
              <p className="text-[#727783] font-semibold mt-1 flex items-center gap-2">
                 Immutable Event Ledger · <span className="text-[#00478d] font-bold">SHA-256 Verified</span>
              </p>
           </div>
        </div>
      </div>

      {/* Main Status Area */}
      <Card className="rounded-[2.5rem] border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.06)] overflow-hidden bg-white">
        <CardContent className="py-24 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00478d] via-[#3b82f6] to-[#00478d] opacity-20" />
           
           <div className="w-24 h-24 rounded-3xl bg-[#f7f9fb] border border-[#eceef0] flex items-center justify-center mx-auto mb-8 shadow-sm group">
              <Clock className="w-10 h-10 text-[#00478d] animate-pulse" />
           </div>
           
           <h2 className="text-3xl font-black text-[#191c1e] mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>Archive Synchronization</h2>
           <p className="text-[#727783] max-w-md mx-auto text-sm font-medium leading-relaxed">
             The immutable audit trail is currently being indexed for the final portal integration. Once active, it will capture all granular interactions including clinical record access and role elevations.
           </p>

           <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
             {[
               { icon: Lock, label: "Login Vectors", color: "#00478d", bg: "#d6e3ff", border: "#cae2fe" },
               { icon: Fingerprint, label: "Role Shifts", color: "#7c3aed", bg: "#f5f3ff", border: "#ede9fe" },
               { icon: ShieldCheck, label: "Decisions", color: "#16a34a", bg: "#f0fdf4", border: "#dcfce7" },
             ].map(({ icon: Icon, label, color, bg, border }) => (
               <div key={label} className="p-6 rounded-2xl bg-[#fcfdfe] border border-[#eceef0] transition-all hover:shadow-lg hover:-translate-y-1 group">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border transition-transform group-hover:scale-110 mx-auto" style={{ background: bg, borderColor: border }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#727783] mb-1">{label}</p>
                 <p className="text-xs font-bold text-[#191c1e]">Real-time Stream</p>
               </div>
             ))}
           </div>

           <div className="mt-16 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-[#c2c6d4]">
              <div className="w-2 h-2 rounded-full bg-[#16a34a] animate-ping" />
              Monitoring Infrastructure Node: AF-240
           </div>
        </CardContent>
      </Card>

      <div className="p-10 bg-[#00478d] rounded-[3rem] text-white shadow-2xl shadow-[#00478d]/20 relative overflow-hidden group">
         <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-8 h-8 text-[#f0fdf4]" />
               </div>
               <div>
                  <h4 className="text-xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Security Compliance Active</h4>
                  <p className="text-sm text-white/50 mt-1 font-medium italic">All background events are currently being logged successfully.</p>
               </div>
            </div>
            <button className="shrink-0 flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-[#00478d] hover:bg-[#d6e3ff] transition-all font-black uppercase text-[10px] tracking-widest shadow-xl shadow-black/10">
               Generate Report <ArrowRight className="w-4 h-4" />
            </button>
         </div>
      </div>
    </div>
  );
}

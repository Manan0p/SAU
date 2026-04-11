"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, ShieldCheck, Fingerprint, ShieldAlert, RefreshCw, FileSearch } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  target: string;
  targetId: string;
  details: any;
  created_at: string;
  profiles?: { name: string; email: string };
};

export default function AdminAuditPage() {
  const { isInitialized, hasRole } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    // Admin has access to audit_logs due to RLS policies
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        *,
        profiles:actorId(name, email)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLogs(data as any);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isInitialized && hasRole("admin")) {
      fetchLogs();
    }
  }, [isInitialized, hasRole, fetchLogs]);

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
        
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl border border-[#eceef0] bg-white text-[#424752] hover:text-[#00478d] hover:bg-[#f7f9fb] text-xs font-black uppercase tracking-widest transition-all shadow-sm disabled:opacity-50"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.06)] overflow-hidden">
        <div className="px-10 py-8 border-b border-[#eceef0] flex items-center justify-between bg-[#fcfdfe]">
           <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#00478d]" />
              <h3 className="text-lg font-extrabold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>
                 System Events <span className="text-[#c2c6d4] font-bold ml-2">({logs.length})</span>
              </h3>
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#16a34a] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
              Monitoring Active
           </span>
        </div>

        <div className="overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-12 h-12 border-4 border-[#00478d] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#727783] text-[10px] font-black uppercase tracking-[0.3em]">Querying Ledger...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-32 text-center bg-[#fcfdfe] relative">
               <div className="w-20 h-20 rounded-full bg-[#f7f9fb] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-[#eceef0]">
                  <FileSearch className="w-8 h-8 text-[#c2c6d4]" />
               </div>
               <p className="text-[#191c1e] text-xl font-extrabold" style={{ fontFamily: 'var(--font-manrope)' }}>
                 Ledger Empty
               </p>
               <p className="text-[#727783] text-xs mt-2 font-bold uppercase tracking-widest opacity-80">
                 No auditable events found
               </p>
            </div>
          ) : (
            <div className="divide-y divide-[#eceef0]">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-col md:flex-row md:items-center gap-6 px-10 py-6 hover:bg-[#f7f9fb] transition-all group border-l-[3px] border-l-transparent hover:border-l-[#00478d]">
                  <div className="w-12 h-12 rounded-xl bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center shrink-0 border border-[#ede9fe] shadow-sm">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                       <p className="font-extrabold text-[#191c1e] text-base" style={{ fontFamily: 'var(--font-manrope)' }}>
                         {log.action}
                       </p>
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-[#eceef0]/60 px-2.5 py-1 rounded-lg border border-[#eceef0] text-[#727783]">
                         {log.target}
                       </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-sm font-semibold text-[#00478d]">
                         {log.profiles?.name || log.actorId}
                       </span>
                       <span className="text-xs font-bold text-[#c2c6d4] uppercase tracking-widest">
                         • {formatDate(log.created_at)}
                       </span>
                    </div>
                    {/* Render JSON Details gracefully */}
                    {log.details && (
                       <pre className="mt-3 text-xs bg-[#f2f4f6] text-[#4a6078] p-3 rounded-xl overflow-x-auto border border-[#eceef0] font-mono leading-relaxed">
                          {JSON.stringify(log.details, null, 2)}
                       </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

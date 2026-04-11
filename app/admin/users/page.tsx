"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search, UserCog, RefreshCw, Shield, Fingerprint, ShieldAlert, Mail, MapPin, X, Phone, User as UserIcon, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ToastProvider";

type UserRole = "student" | "doctor" | "pharmacy" | "admin" | "insurance" | "medical_center";

const ROLE_STYLES: Record<UserRole, { bg: string, text: string, border: string, label: string }> = {
  student:        { bg: "bg-[#f5f3ff]", text: "text-[#7c3aed]", border: "border-[#ede9fe]", label: "Student" },
  doctor:         { bg: "bg-[#f0fdf4]", text: "text-[#16a34a]", border: "border-[#dcfce7]", label: "Doctor" },
  pharmacy:       { bg: "bg-[#ecfdf5]", text: "text-[#059669]", border: "border-[#d1fae5]", label: "Pharmacy" },
  admin:          { bg: "bg-[#fef2f2]", text: "text-[#dc2626]", border: "border-[#fee2e2]", label: "Platform Admin" },
  insurance:      { bg: "bg-[#fffbeb]", text: "text-[#d97706]", border: "border-[#fef3c7]", label: "Insurance" },
  medical_center: { bg: "bg-[#eff6ff]", text: "text-[#2563eb]", border: "border-[#dbeafe]", label: "Medical Center" },
};

interface Profile {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  college_id?: string;
  phone?: string;
  class?: string;
  branch?: string;
  batch?: string;
  blood_group?: string;
  medical_conditions?: string;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No active session. Please log in again.");
      }

      const res = await fetch("/api/admin/roles", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const body = await res.json();
      setUsers((body.users ?? []) as Profile[]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Registry load failure:", msg);
      setError(msg);
      toast({
        title: "Registry Sync Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.college_id?.toLowerCase().includes(search.toLowerCase());
      
    const matchesRole = filterRole === "all" || u.roles?.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    students: users.filter((u) => u.roles?.includes("student")).length,
    staff: users.filter((u) => !u.roles?.includes("student") && !u.roles?.includes("admin")).length,
    admins: users.filter((u) => u.roles?.includes("admin")).length,
  };

  return (
    <div className="min-h-screen pb-20 p-10 max-w-7xl mx-auto space-y-10" style={{ background: "#f7f9fb" }}>
      {/* Detailed Modal */}
      {selectedUser && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: "rgba(25, 28, 30, 0.4)", backdropFilter: "blur(12px)" }}>
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#eceef0] shadow-[0_24px_48px_rgba(25,28,30,0.15)] animate-in fade-in zoom-in-95 duration-300">
               <div className="relative p-10">
                  <button onClick={() => setSelectedUser(null)} className="absolute top-8 right-8 w-10 h-10 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#727783] hover:text-[#191c1e] hover:bg-[#eceef0] transition-colors">
                     <X className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-6 mb-8">
                     <div className="w-20 h-20 rounded-3xl bg-[#00478d] flex items-center justify-center text-white text-3xl font-black shadow-[0_8px_24px_rgba(0,71,141,0.25)] border-[3px] border-[#cae2fe]">
                       {selectedUser.name?.slice(0, 1).toUpperCase() ?? "?"}
                     </div>
                     <div>
                        <h2 className="text-3xl font-extrabold text-[#191c1e] tracking-tight">{selectedUser.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                           {(selectedUser.roles ?? []).map((r) => {
                             const style = ROLE_STYLES[r] ?? { bg: "bg-[#f2f4f6]", text: "text-[#727783]", border: "border-[#eceef0]", label: r };
                             return (
                               <div key={r} className={cn("text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-xl border flex items-center gap-1.5 shadow-sm", style.bg, style.text, style.border)}>
                                 <div className={cn("w-1.5 h-1.5 rounded-full", r === 'admin' ? "bg-red-500" : "bg-current")} />
                                 {style.label}
                               </div>
                             );
                           })}
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#727783] mb-3 flex items-center gap-2"><UserIcon className="w-3.5 h-3.5" /> Contact Info</p>
                           <div className="space-y-2">
                              <p className="text-sm font-bold text-[#191c1e] bg-[#fcfdfe] border border-[#eceef0] p-3 rounded-xl flex items-center gap-3">
                                 <Mail className="w-4 h-4 text-[#00478d]" /> {selectedUser.email || "—"}
                              </p>
                              <p className="text-sm font-bold text-[#191c1e] bg-[#fcfdfe] border border-[#eceef0] p-3 rounded-xl flex items-center gap-3">
                                 <Phone className="w-4 h-4 text-[#00478d]" /> {selectedUser.phone || "—"}
                              </p>
                           </div>
                        </div>

                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#727783] mb-3 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Academic Info</p>
                           <div className="space-y-2">
                              <p className="text-sm font-bold text-[#191c1e] bg-[#fcfdfe] border border-[#eceef0] p-3 rounded-xl flex justify-between">
                                 <span className="text-[#727783]">ID / Col Badge</span> {selectedUser.college_id || "—"}
                              </p>
                              <p className="text-sm font-bold text-[#191c1e] bg-[#fcfdfe] border border-[#eceef0] p-3 rounded-xl flex justify-between">
                                 <span className="text-[#727783]">Class / Year</span> {selectedUser.class || "—"}
                              </p>
                              <p className="text-sm font-bold text-[#191c1e] bg-[#fcfdfe] border border-[#eceef0] p-3 rounded-xl flex justify-between">
                                 <span className="text-[#727783]">Branch</span> {selectedUser.branch || "—"}
                              </p>
                              <p className="text-sm font-bold text-[#191c1e] bg-[#fcfdfe] border border-[#eceef0] p-3 rounded-xl flex justify-between">
                                 <span className="text-[#727783]">Batch</span> {selectedUser.batch || "—"}
                              </p>
                           </div>
                        </div>
                     </div>

                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#727783] mb-3 flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Health Profile</p>
                        <div className="space-y-4">
                           <div className="bg-[#fff0f4] border border-[#ffdce6] p-5 rounded-2xl">
                              <p className="text-[11px] font-black uppercase tracking-widest text-[#ba1a1a] mb-1">Blood Group</p>
                              <p className="text-3xl font-black text-[#ba1a1a]">{selectedUser.blood_group || "Unknown"}</p>
                           </div>
                           <div className="bg-[#f2f4f6] border border-[#eceef0] p-5 rounded-2xl">
                              <p className="text-[11px] font-black uppercase tracking-widest text-[#4a6078] mb-2">Medical Conditions</p>
                              <p className="text-sm font-bold text-[#191c1e] leading-relaxed">
                                {selectedUser.medical_conditions || "None reported."}
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#00478d] text-white shadow-xl shadow-[#00478d]/20 transition-transform hover:scale-105 duration-300">
              <UserCog className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Account Registry</h1>
              <p className="text-[#727783] font-semibold mt-1 flex items-center gap-2">
                 Centralized Identity Oversight · <span className="text-[#00478d] font-bold">Encrypted Archive</span>
              </p>
           </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl border border-[#eceef0] bg-white text-[#424752] hover:text-[#00478d] hover:bg-[#f7f9fb] text-xs font-black uppercase tracking-widest transition-all shadow-sm disabled:opacity-50"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Summary Area */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Accounts",    value: stats.total,    color: "#00478d", bg: "#d6e3ff", border: "#cae2fe" },
          { label: "Enrolled Students", value: stats.students, color: "#7c3aed", bg: "#f5f3ff", border: "#ede9fe" },
          { label: "Clinical Staff",    value: stats.staff,    color: "#16a34a", bg: "#f0fdf4", border: "#dcfce7" },
          { label: "Portal Admins",     value: stats.admins,   color: "#dc2626", bg: "#fef2f2", border: "#fee2e2" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className="bg-white rounded-[2rem] p-6 border border-[#eceef0] shadow-[0_4px_20px_rgba(25,28,30,0.04)] group hover:shadow-xl transition-all duration-300">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 border group-hover:scale-110 transition-transform" style={{ background: bg, borderColor: border }}>
               <Users className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-[#727783] text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-3xl font-black text-[#191c1e] leading-none" style={{ fontFamily: 'var(--font-manrope)' }}>{loading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Controls Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c2c6d4] group-focus-within:text-[#00478d] transition-colors" />
            <Input
              placeholder="Search directory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 rounded-2xl bg-white border-[#eceef0] focus:ring-[#00478d]/10 focus:border-[#00478d] font-bold text-[#191c1e] shadow-sm transition-all placeholder:text-[#c2c6d4] placeholder:font-medium"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | "all")}
            className="h-14 px-5 bg-white border border-[#eceef0] rounded-2xl text-sm font-bold text-[#424752] focus:outline-none focus:ring-2 focus:ring-[#00478d]/10 focus:border-[#00478d] transition-all shadow-sm cursor-pointer"
          >
             <option value="all">All Roles</option>
             <option value="student">Students</option>
             <option value="doctor">Doctors</option>
             <option value="pharmacy">Pharmacy</option>
             <option value="insurance">Insurance</option>
             <option value="medical_center">Medical Center</option>
             <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Main List Area */}
      <div className="bg-white rounded-[2.5rem] border border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.06)] overflow-hidden">
        <div className="px-10 py-8 border-b border-[#eceef0] flex items-center justify-between bg-[#fcfdfe]">
           <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#00478d]" />
              <h3 className="text-lg font-extrabold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>
                 Identity Directory <span className="text-[#c2c6d4] font-bold ml-2">({filtered.length})</span>
              </h3>
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c2c6d4] flex items-center gap-2">
              Secured via Service Role <Fingerprint className="w-3.5 h-3.5" />
           </span>
        </div>

        <div className="overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-12 h-12 border-4 border-[#00478d] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#727783] text-[10px] font-black uppercase tracking-[0.3em]">Synching with Infrastructure...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-32 text-center bg-[#fcfdfe] relative">
               <div className="w-20 h-20 rounded-full bg-[#f7f9fb] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-[#eceef0]">
                  <Search className="w-8 h-8 text-[#c2c6d4]" />
               </div>
               <p className="text-[#191c1e] text-xl font-extrabold" style={{ fontFamily: 'var(--font-manrope)' }}>
                 {error ? "Access Denied" : "No Results Found"}
               </p>
               <p className="text-[#727783] text-xs mt-2 font-bold uppercase tracking-widest opacity-80">
                 {error ? "Verify your admin permissions" : "Adjust your search query"}
               </p>
               {users.length === 0 && !error && (
                 <button onClick={load} className="mt-8 text-[11px] font-black text-[#00478d] underline decoration-2 underline-offset-4 uppercase tracking-[0.2em]">Re-initialize Sync</button>
               )}
            </div>
          ) : (
            <div className="divide-y divide-[#eceef0]">
              {filtered.map((u) => (
                <div 
                   key={u.id} 
                   onClick={() => setSelectedUser(u)}
                   className="flex flex-col md:flex-row md:items-center gap-6 px-10 py-6 hover:bg-[#f7f9fb] transition-all group border-l-[3px] border-l-transparent hover:border-l-[#00478d] cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#00478d] text-xl font-black shrink-0 border border-[#eceef0] group-hover:bg-white shadow-sm transition-all group-hover:scale-105 duration-300">
                    {u.name?.slice(0, 1).toUpperCase() ?? "?"}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                       <p className="font-black text-[#191c1e] text-lg truncate group-hover:text-[#00478d] transition-colors leading-none" style={{ fontFamily: 'var(--font-manrope)' }}>{u.name}</p>
                       {u.roles?.includes("admin") && <ShieldAlert className="w-4 h-4 text-[#dc2626] animate-pulse" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                       <span className="flex items-center gap-2 text-[#727783] text-xs font-bold">
                          <Mail className="w-3.5 h-3.5 opacity-40" /> {u.email}
                       </span>
                       {u.college_id && (
                         <span className="flex items-center gap-2 text-[#727783] text-[11px] font-black uppercase tracking-widest bg-[#eceef0]/60 px-2.5 py-1 rounded-lg border border-[#eceef0]">
                            <Fingerprint className="w-3.5 h-3.5 opacity-40" /> {u.college_id}
                         </span>
                       )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end shrink-0 pt-2 md:pt-0">
                    {(u.roles ?? []).map((r) => {
                      const style = ROLE_STYLES[r] ?? { bg: "bg-[#f2f4f6]", text: "text-[#727783]", border: "border-[#eceef0]", label: r };
                      return (
                        <div key={r} className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-xl border flex items-center gap-2 shadow-sm transition-all group-hover:bg-white", style.bg, style.text, style.border)}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", r === 'admin' ? "bg-red-500" : "bg-current")} />
                          {style.label}
                        </div>
                      );
                    })}
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

"use client";

import { useState } from "react";
import { User, Save, RefreshCw, Droplets, Stethoscope, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "@/lib/auth";
import { useToast } from "@/components/ToastProvider";
import { getInitials } from "@/lib/utils";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function ProfileContent() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    class: user?.class ?? "",
    branch: user?.branch ?? "",
    batch: user?.batch ?? "",
    college_id: user?.college_id ?? user?.studentId ?? "",
    blood_group: user?.blood_group ?? "",
    medical_conditions: user?.medical_conditions ?? "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const result = await updateProfile(user.id, form);
    setSaving(false);
    if (result.success) {
      await refreshUser();
      toast({ title: "Profile updated ✓", variant: "success" });
    } else {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="p-10 max-w-4xl mx-auto pb-32" style={{ background: "#f7f9fb", minHeight: "100vh" }}>
      
      {/* Header Profile Section */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-20 h-20 rounded-[1.25rem] bg-[#d6e3ff] flex items-center justify-center text-[#00478d] text-3xl font-bold shadow-sm" style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}>
          <span className="text-white">{user ? getInitials(user.name) : "?"}</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] mb-1.5" style={{ fontFamily: 'var(--font-manrope)' }}>{user?.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {user?.roles?.map((r) => (
              <span key={r} className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#d6e3ff] text-[#00478d]">
                {r.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#f2f4f6] flex items-center justify-center">
              <User className="w-5 h-5 text-[#4a6078]" />
            </div>
            <h2 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Full Name</label>
              <input 
                value={form.name} 
                onChange={set("name")} 
                placeholder="Your full name" 
                className="w-full bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:bg-white focus:border-[#cae2fe] focus:ring-4 focus:ring-[#cae2fe]/40 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Phone Number</label>
              <input 
                value={form.phone} 
                onChange={set("phone")} 
                placeholder="+91 9876543210" 
                className="w-full bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:bg-white focus:border-[#cae2fe] focus:ring-4 focus:ring-[#cae2fe]/40 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">College ID</label>
              <input 
                value={form.college_id} 
                onChange={set("college_id")} 
                placeholder="SAU/2024/001" 
                className="w-full bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:bg-white focus:border-[#cae2fe] focus:ring-4 focus:ring-[#cae2fe]/40 transition-all outline-none font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Email</label>
              <input 
                value={user?.email ?? ""} 
                disabled 
                className="w-full bg-[#f2f4f6] opacity-70 border border-transparent rounded-xl px-4 py-3 text-sm text-[#424752] cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#d6e3ff] flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-[#00478d]" />
            </div>
            <h2 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>Academic Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Class / Year</label>
              <input 
                value={form.class} 
                onChange={set("class")} 
                placeholder="e.g. 3rd Year" 
                className="w-full bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:bg-white focus:border-[#cae2fe] focus:ring-4 focus:ring-[#cae2fe]/40 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Branch / Programme</label>
              <input 
                value={form.branch} 
                onChange={set("branch")} 
                placeholder="e.g. B.Tech CSE" 
                className="w-full bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:bg-white focus:border-[#cae2fe] focus:ring-4 focus:ring-[#cae2fe]/40 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Batch</label>
              <input 
                value={form.batch} 
                onChange={set("batch")} 
                placeholder="e.g. 2022–2026" 
                className="w-full bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:bg-white focus:border-[#cae2fe] focus:ring-4 focus:ring-[#cae2fe]/40 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Medical Info */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#ffdad6] flex items-center justify-center">
              <Droplets className="w-5 h-5 text-[#ba1a1a]" />
            </div>
            <h2 className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>Medical Information</h2>
          </div>
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Blood Group</label>
              <div className="flex flex-wrap gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setForm((f) => ({ ...f, blood_group: bg }))}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      form.blood_group === bg
                        ? "bg-[#ffdad6] border-[#ffb4ab] text-[#ba1a1a] shadow-sm"
                        : "bg-[#f7f9fb] border-[#e0e3e5] text-[#424752] hover:border-[#a9c7ff] hover:bg-white"
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Known Medical Conditions / Allergies</label>
              <textarea
                className="w-full bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:bg-white focus:border-[#cae2fe] focus:ring-4 focus:ring-[#cae2fe]/40 transition-all outline-none resize-none"
                rows={4}
                placeholder="e.g. Asthma, Penicillin allergy, Diabetes Type 2…"
                value={form.medical_conditions}
                onChange={(e) => setForm((f) => ({ ...f, medical_conditions: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-8 py-4 rounded-xl text-sm font-bold text-white transition-all shadow-[0_4px_16px_rgba(0,94,184,0.15)] hover:scale-105 disabled:opacity-50 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Saving Changes…" : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
}

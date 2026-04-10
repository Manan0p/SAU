"use client";

import { useState } from "react";
import { User, Save, RefreshCw, Droplets, Stethoscope, ChevronRight, Mail, Phone, Fingerprint, CalendarDays, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ToastProvider";
import { getInitials, cn } from "@/lib/utils";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ROLE_LABELS: Record<string, string> = {
  student: "Enrolled Student",
  doctor: "Medical Officer",
  pharmacy: "Pharmacist",
  admin: "Portal Administrator",
  insurance: "Insurance Auditor",
  medical_center: "Clinical Staff",
};

export default function ProfilePage() {
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
    if (result.success) {
      await refreshUser();
      toast({ title: "Profile updated ✓", variant: "success" });
    } else {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
    }
    setSaving(false);
  };

  const initials = user?.name ? getInitials(user.name) : "??";

  return (
    <div className="min-h-screen pb-20 p-10 max-w-5xl mx-auto space-y-10" style={{ background: "#f7f9fb" }}>
      {/* Header Area */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#00478d] to-[#005eb8] flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-[#00478d]/20 border-4 border-white transition-transform hover:scale-105 duration-300">
            {initials}
          </div>
          <div className="pb-2">
            <h1 className="text-4xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>
               {user?.name || "Member Profile"}
            </h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {(user?.roles || ["Guest"]).map((r) => (
                <Badge key={r} className="bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-lg">
                   {ROLE_LABELS[r] || r}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg" className="rounded-2xl gap-2 font-black uppercase text-xs tracking-widest px-8 h-14 shadow-lg shadow-[#00478d]/20 bg-[#00478d] hover:bg-[#005eb8]">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Updating…" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
           {/* Section: Credentials */}
           <Card className="rounded-[2.5rem] border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.06)] overflow-hidden">
             <CardHeader className="px-8 pt-8 pb-4">
               <CardTitle className="text-xl font-extrabold text-[#191c1e] flex items-center gap-3">
                 <User className="w-5 h-5 text-[#00478d]" />
                 Personal Registry
               </CardTitle>
             </CardHeader>
             <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Full Identity</Label>
                   <Input value={form.name} onChange={set("name")} className="h-12 rounded-xl bg-[#fcfdfe] border-[#eceef0] focus:ring-[#005eb8]/10" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Contact String</Label>
                   <Input value={form.phone} onChange={set("phone")} className="h-12 rounded-xl bg-[#fcfdfe] border-[#eceef0] focus:ring-[#005eb8]/10" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Institutional Identifier</Label>
                   <Input value={form.college_id} onChange={set("college_id")} className="h-12 rounded-xl bg-[#fcfdfe] border-[#eceef0] focus:ring-[#005eb8]/10" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Verified Gateway</Label>
                   <Input value={user?.email ?? ""} disabled className="h-12 rounded-xl bg-[#f2f4f6] border-[#eceef0] opacity-60 cursor-not-allowed font-medium" />
                </div>
             </CardContent>
           </Card>

           {/* Section: Environment */}
           <Card className="rounded-[2.5rem] border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.06)] overflow-hidden">
             <CardHeader className="px-8 pt-8 pb-4">
               <CardTitle className="text-xl font-extrabold text-[#191c1e] flex items-center gap-3">
                 <CalendarDays className="w-5 h-5 text-[#3b82f6]" />
                 Academic Context
               </CardTitle>
             </CardHeader>
             <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Current Staging</Label>
                   <Input value={form.class} onChange={set("class")} placeholder="Year / Grade" className="h-12 rounded-xl bg-[#fcfdfe] border-[#eceef0]" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Specialization</Label>
                   <Input value={form.branch} onChange={set("branch")} placeholder="Major / Branch" className="h-12 rounded-xl bg-[#fcfdfe] border-[#eceef0]" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Timeframe</Label>
                   <Input value={form.batch} onChange={set("batch")} placeholder="Batch Year" className="h-12 rounded-xl bg-[#fcfdfe] border-[#eceef0]" />
                </div>
             </CardContent>
           </Card>
        </div>

        <div className="space-y-8">
           {/* Section: Biological Data */}
           <Card className="rounded-[2.5rem] border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.06)] overflow-hidden">
             <CardHeader className="p-8 pb-4">
               <CardTitle className="text-xl font-extrabold text-[#191c1e] flex items-center gap-3">
                 <Droplets className="w-5 h-5 text-[#dc2626]" />
                 Vital Metrics
               </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Blood Group Vector</Label>
                   <div className="grid grid-cols-4 gap-2">
                     {BLOOD_GROUPS.map((bg) => (
                       <button
                         key={bg}
                         onClick={() => setForm((f) => ({ ...f, blood_group: bg }))}
                         className={cn(
                           "h-10 rounded-xl text-xs font-black transition-all border",
                           form.blood_group === bg
                             ? "bg-[#dc2626] border-[#dc2626] text-white shadow-lg shadow-[#dc2626]/20"
                             : "bg-[#fcfdfe] border-[#eceef0] text-[#727783] hover:border-[#dc2626]/20"
                         )}
                       >
                         {bg}
                       </button>
                     ))}
                   </div>
                </div>
                
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1 flex items-center gap-2">
                      Clinical Alerts <Badge className="bg-[#fff7ed] text-[#ea580c] border-[#ffedd5] font-black text-[9px] px-2 py-0">Critical</Badge>
                   </Label>
                   <textarea
                     className="w-full rounded-2xl border border-[#eceef0] bg-[#fcfdfe] px-4 py-4 text-sm text-[#191c1e] placeholder:text-[#c2c6d4] focus:outline-none focus:ring-2 focus:ring-[#005eb8]/10 resize-none font-medium leading-relaxed"
                     rows={4}
                     placeholder="Document any persistent conditions, recurring allergies, or vital medical history…"
                     value={form.medical_conditions}
                     onChange={(e) => setForm((f) => ({ ...f, medical_conditions: e.target.value }))}
                   />
                </div>
             </CardContent>
           </Card>

           <div className="p-8 bg-[#00478d] rounded-[2.5rem] text-white shadow-2xl shadow-[#00478d]/20 relative overflow-hidden group transition-transform hover:scale-[1.02] duration-500">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">Security Protocol</p>
                 <h4 className="text-lg font-bold mb-4 leading-tight">Identity Persistence</h4>
                 <p className="text-sm text-white/70 font-medium leading-relaxed mb-6">
                    All profile modifications are logged in our secure clinical audit trail. Ensure your medical data is accurate for emergency SOS precision.
                 </p>
                 <div className="flex items-center gap-2 text-white/40 text-[9px] font-black uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" /> End-to-End Encryption Active
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

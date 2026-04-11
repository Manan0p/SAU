"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Save, RefreshCw, Droplets, Stethoscope, Mail, Phone, CalendarDays, ShieldCheck, Lock } from "lucide-react";
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

export default function ProfileSettingsPage() {
  const { user, refreshUser, hasRole } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    class: "",
    branch: "",
    batch: "",
    college_id: "",
    blood_group: "",
    medical_conditions: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        phone: user.phone ?? "",
        class: user.class ?? "",
        branch: user.branch ?? "",
        batch: user.batch ?? "",
        college_id: user.college_id ?? user.studentId ?? "",
        blood_group: user.blood_group ?? "",
        medical_conditions: user.medical_conditions ?? "",
      });
    }
  }, [user]);

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
  const isStudent = hasRole("student");

  return (
    <div className="min-h-screen pb-20 p-8 max-w-5xl mx-auto space-y-8" style={{ background: "#f7f9fb" }}>
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1 bg-[#eceef0]/50 p-1.5 rounded-2xl w-fit">
        <Link 
          href="/settings/profile" 
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            pathname === "/settings/profile" 
              ? "bg-white text-[#00478d] shadow-sm" 
              : "text-[#727783] hover:text-[#191c1e]"
          )}
        >
          Personal Info
        </Link>
        <Link 
          href="/settings/security" 
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            pathname === "/settings/security" 
              ? "bg-white text-[#00478d] shadow-sm" 
              : "text-[#727783] hover:text-[#191c1e]"
          )}
        >
          Security & Password
        </Link>
      </div>

      {/* Header Area */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-[#00478d] to-[#005eb8] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-[#00478d]/20 border-4 border-white">
            {initials}
          </div>
          <div className="pb-1">
            <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>
               {user?.name || "Edit Profile"}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {(user?.roles || ["Guest"]).map((r) => (
                <Badge key={r} className="bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7] font-black uppercase text-[9px] tracking-widest px-2.5 py-0.5 rounded-lg">
                   {ROLE_LABELS[r] || r}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg" className="rounded-2xl gap-2 font-black uppercase text-xs tracking-widest px-8 h-12 shadow-lg shadow-[#00478d]/20 bg-[#00478d] hover:bg-[#005eb8]">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Updating…" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Section: Identity */}
           <Card className="rounded-[2rem] border-[#eceef0] shadow-[0_4px_20px_rgba(25,28,30,0.04)]">
             <CardHeader className="p-8 pb-4">
               <CardTitle className="text-lg font-extrabold text-[#191c1e] flex items-center gap-3">
                 <User className="w-5 h-5 text-[#00478d]" />
                 Personal Registry
               </CardTitle>
             </CardHeader>
             <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Full Identity</Label>
                   <Input value={form.name} onChange={set("name")} className="h-11 rounded-xl bg-[#fcfdfe] border-[#eceef0]" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Contact Phone</Label>
                   <Input value={form.phone} onChange={set("phone")} className="h-11 rounded-xl bg-[#fcfdfe] border-[#eceef0]" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Campus ID</Label>
                   <Input value={form.college_id} onChange={set("college_id")} className="h-11 rounded-xl bg-[#fcfdfe] border-[#eceef0]" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Verified Gateway</Label>
                   <Input value={user?.email ?? ""} disabled className="h-11 rounded-xl bg-[#f2f4f6] border-[#eceef0] opacity-60 cursor-not-allowed" />
                </div>
             </CardContent>
           </Card>

           {/* Section: Environment (Student Only) */}
           {isStudent && (
             <Card className="rounded-[2rem] border-[#eceef0] shadow-[0_4px_20px_rgba(25,28,30,0.04)]">
               <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-lg font-extrabold text-[#191c1e] flex items-center gap-3">
                   <CalendarDays className="w-5 h-5 text-[#3b82f6]" />
                   Academic Context
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Year / Class</Label>
                     <Input value={form.class} onChange={set("class")} className="h-11 rounded-xl bg-[#fcfdfe] border-[#eceef0]" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Programme</Label>
                     <Input value={form.branch} onChange={set("branch")} className="h-11 rounded-xl bg-[#fcfdfe] border-[#eceef0]" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Batch</Label>
                     <Input value={form.batch} onChange={set("batch")} className="h-11 rounded-xl bg-[#fcfdfe] border-[#eceef0]" />
                  </div>
               </CardContent>
             </Card>
           )}
        </div>

        <div className="space-y-8">
           {/* Section: Biological Data (Student preferred, also relevant for others) */}
           <Card className="rounded-[2rem] border-[#eceef0] shadow-[0_4px_20px_rgba(25,28,30,0.04)]">
             <CardHeader className="p-8 pb-4">
               <CardTitle className="text-lg font-extrabold text-[#191c1e] flex items-center gap-3">
                 <Droplets className="w-5 h-5 text-[#dc2626]" />
                 Vital Metrics
               </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Blood Group Vector</Label>
                   <div className="grid grid-cols-4 gap-1.5">
                     {BLOOD_GROUPS.map((bg) => (
                       <button
                         key={bg}
                         onClick={() => setForm((f) => ({ ...f, blood_group: bg }))}
                         className={cn(
                           "h-9 rounded-lg text-[10px] font-black transition-all border",
                           form.blood_group === bg
                             ? "bg-[#dc2626] border-[#dc2626] text-white shadow-md shadow-[#dc2626]/20"
                             : "bg-[#fcfdfe] border-[#eceef0] text-[#727783] hover:border-[#dc2626]/20"
                         )}
                       >
                         {bg}
                       </button>
                     ))}
                   </div>
                </div>
                
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Clinical Alerts</Label>
                   <textarea
                     className="w-full rounded-xl border border-[#eceef0] bg-[#fcfdfe] px-4 py-3 text-sm text-[#191c1e] placeholder:text-[#c2c6d4] focus:outline-none focus:ring-2 focus:ring-[#005eb8]/10 resize-none font-medium leading-relaxed"
                     rows={4}
                     placeholder="Conditions, allergies, or history…"
                     value={form.medical_conditions}
                     onChange={(e) => setForm((f) => ({ ...f, medical_conditions: e.target.value }))}
                   />
                </div>
             </CardContent>
           </Card>

           <div className="p-6 bg-[#00478d] rounded-[2rem] text-white shadow-xl shadow-[#00478d]/10 relative overflow-hidden">
               <div className="relative z-10 flex flex-col items-center text-center">
                  <ShieldCheck className="w-8 h-8 text-white/40 mb-3" />
                  <h4 className="text-sm font-bold mb-2">Identity Persistence</h4>
                  <p className="text-[11px] text-white/60 font-medium leading-relaxed">
                     Changes are logged for security. Keep your medical data accurate for emergency response precision.
                  </p>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
}

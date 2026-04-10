"use client";

import { useState } from "react";
import { User, Save, RefreshCw, Droplets, Stethoscope } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-500/30">
          {user ? getInitials(user.name) : "?"}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {user?.roles?.map((r) => (
              <Badge key={r} className="text-xs">{r}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={form.name} onChange={set("name")} placeholder="Your full name" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number</Label>
            <Input value={form.phone} onChange={set("phone")} placeholder="+91 9876543210" />
          </div>
          <div className="space-y-1.5">
            <Label>College ID</Label>
            <Input value={form.college_id} onChange={set("college_id")} placeholder="SAU/2024/001" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="opacity-50 cursor-not-allowed" />
          </div>
        </CardContent>
      </Card>

      {/* Academic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-400" />
            Academic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <Label>Class / Year</Label>
            <Input value={form.class} onChange={set("class")} placeholder="e.g. 3rd Year" />
          </div>
          <div className="space-y-1.5">
            <Label>Branch / Programme</Label>
            <Input value={form.branch} onChange={set("branch")} placeholder="e.g. B.Tech CSE" />
          </div>
          <div className="space-y-1.5">
            <Label>Batch</Label>
            <Input value={form.batch} onChange={set("batch")} placeholder="e.g. 2022–2026" />
          </div>
        </CardContent>
      </Card>

      {/* Medical Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-red-400" />
            Medical Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Blood Group</Label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setForm((f) => ({ ...f, blood_group: bg }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.blood_group === bg
                      ? "bg-red-500/20 border-red-500/40 text-red-300"
                      : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Known Medical Conditions / Allergies</Label>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              rows={3}
              placeholder="e.g. Asthma, Penicillin allergy, Diabetes Type 2…"
              value={form.medical_conditions}
              onChange={(e) => setForm((f) => ({ ...f, medical_conditions: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving…" : "Save Profile"}
      </Button>
    </div>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
}

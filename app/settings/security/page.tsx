"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, ShieldCheck, RefreshCw, Eye, EyeOff, Save, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ToastProvider";
import { cn } from "@/lib/utils";

export default function SecuritySettingsPage() {
  const { changePassword } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.newPassword.length < 8) {
      toast({ title: "Weak password", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast({ title: "Matching Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const result = await changePassword(form.newPassword);
    setSaving(false);

    if (result.success) {
      toast({ title: "Password Updated", description: "Your credentials have been secured.", variant: "success" });
      setForm({ newPassword: "", confirmPassword: "" });
    } else {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
    }
  };

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

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>
            Account Security
          </h1>
          <p className="text-sm font-semibold text-[#727783] leading-relaxed max-w-[500px]">
            Manage your credentials and authentication protocols to ensure your clinical data remains private and protected.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[2rem] border-[#eceef0] shadow-[0_4px_20px_rgba(25,28,30,0.04)] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-lg font-extrabold text-[#191c1e] flex items-center gap-3">
                  <Lock className="w-5 h-5 text-[#00478d]" />
                  Internal Credential Update
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSave} className="space-y-8 max-w-md">
                   <div className="space-y-2 relative">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">New Secure Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={form.newPassword}
                          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                          className="h-12 pl-4 pr-12 rounded-xl bg-[#fcfdfe] border-[#eceef0] focus:ring-[#005eb8]/10"
                          placeholder="Min. 8 characters"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c2c6d4] hover:text-[#191c1e] transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                   </div>

                   <div className="space-y-2 relative">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Confirm Identity</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={form.confirmPassword}
                          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                          className="h-12 pl-4 pr-12 rounded-xl bg-[#fcfdfe] border-[#eceef0] focus:ring-[#005eb8]/10"
                          placeholder="Repeat new password"
                          required
                        />
                      </div>
                   </div>

                   <Button
                      type="submit"
                      disabled={saving}
                      className="w-full h-12 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-[#00478d]/10 bg-[#00478d] hover:bg-[#005eb8]"
                   >
                     {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                     {saving ? "Updating..." : "Update Credentials"}
                   </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
             <div className="p-8 bg-white rounded-[2rem] border border-[#eceef0] shadow-[0_4px_20px_rgba(25,28,30,0.04)]">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-xl bg-[#f0fdf4] flex items-center justify-center border border-[#dcfce7]">
                      <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
                   </div>
                   <h4 className="text-sm font-bold text-[#191c1e]">Security Standard</h4>
                </div>
                <ul className="space-y-4">
                   <li className="flex gap-3 text-xs font-semibold text-[#727783] leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] mt-1.5 shrink-0" />
                      Must contain at least 8 characters
                   </li>
                   <li className="flex gap-3 text-xs font-semibold text-[#727783] leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] mt-1.5 shrink-0" />
                      Combination of symbols and numerals is recommended
                   </li>
                   <li className="flex gap-3 text-xs font-semibold text-[#727783] leading-relaxed">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] mt-1.5 shrink-0" />
                      Encryption processed via SHA-256 Protocol
                   </li>
                </ul>
             </div>

             <div className="p-8 bg-[#f2f4f6] rounded-[2rem] border border-[#eceef0]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#727783] mb-3">Audit Trail</p>
                <p className="text-xs font-semibold text-[#424752] leading-relaxed">
                   Device session tokens will remain active after password change. For maximum security, we recommend a manual sign-out from all other devices.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

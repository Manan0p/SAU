"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart, Eye, EyeOff, ArrowRight, Stethoscope, Pill, ShieldCheck, Building2, Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ToastProvider";
import { STAFF_ROLES } from "@/lib/auth";

const ROLE_INFO = [
  { icon: Stethoscope, label: "Doctors", desc: "Appointments & Medical Records" },
  { icon: Pill, label: "Pharmacy", desc: "Inventory & Prescriptions" },
  { icon: ShieldCheck, label: "Insurance", desc: "Claims Review & Approval" },
  { icon: Building2, label: "Medical Center", desc: "SOS Response & Records" },
];

export default function StaffLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { loginStaff, isAuthenticated, initAuth, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) initAuth();
  }, [initAuth, isInitialized]);

  // Only redirect once auth is fully loaded
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    router.replace("/staff/dashboard");
  }, [isInitialized, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await loginStaff(email, password);
    setIsLoading(false);
    if (result.success) {
      toast({ title: "Welcome! 👋", description: "Redirecting to staff dashboard…", variant: "success" });
      router.replace("/staff/dashboard");
    } else {
      toast({ title: "Access Denied", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-12 relative overflow-hidden">
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-80px] right-[-80px] w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl">UniWell</span>
              <span className="ml-2 text-xs text-violet-400 font-semibold bg-violet-500/20 px-2 py-0.5 rounded-full">Staff</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Staff Portal<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Access Panel</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Restricted to UniWell staff members only. Contact your administrator if you need access.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-1 gap-3">
          {ROLE_INFO.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4 bg-white/5 border border-white/8 rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">{label}</p>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">UniWell Staff</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Staff Sign In</h2>
              <p className="text-slate-400 text-sm">Restricted access only</p>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <p className="text-xs text-violet-300 leading-relaxed">
              🔒 This portal is <strong>only accessible to staff members</strong> (doctors, pharmacists, insurance officers, medical center staff). New members must be added by an administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Staff Email</Label>
              <Input id="staff-email" type="email" placeholder="staff@sau.edu.in" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-password">Password</Label>
              <div className="relative">
                <Input id="staff-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="pr-11" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button id="staff-login-submit" type="submit" size="lg" className="w-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verifying…</span>
              ) : (
                <span className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-xs text-slate-600">
            <Link href="/login" className="hover:text-slate-400 transition-colors">← Student Portal</Link>
            <span>·</span>
            <Link href="/admin/login" className="hover:text-slate-400 transition-colors">Admin Portal →</Link>
          </div>
          <p className="mt-4 text-center text-xs text-slate-700">UniWell Staff Portal · Secured by Supabase</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Eye, EyeOff, ArrowRight, ShieldAlert, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ToastProvider";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { loginAdmin, isAuthenticated, initAuth, isInitialized, hasRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => { if (!isInitialized) initAuth(); }, [initAuth, isInitialized]);
  useEffect(() => {
    if (isAuthenticated && hasRole("admin")) router.replace("/admin/dashboard");
  }, [isAuthenticated, hasRole, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await loginAdmin(email, password);
    setIsLoading(false);
    if (result.success) {
      toast({ title: "Welcome, Admin 🛡️", description: "Redirecting to control panel…", variant: "success" });
      router.replace("/admin/dashboard");
    } else {
      toast({ title: "Access Denied", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 p-12 relative overflow-hidden">
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-rose-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-80px] right-[-80px] w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/40">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-xl">UniWell</span>
              <span className="ml-2 text-xs text-rose-400 font-semibold bg-rose-500/20 px-2 py-0.5 rounded-full">Admin</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Admin Control<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Center</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Full system access. Manage users, roles, view audit logs, and oversee all campus health operations.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            "Manage student & staff accounts",
            "Assign and revoke roles",
            "View system audit logs",
            "Monitor all SOS, claims & appointments",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-slate-300 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">UniWell Admin</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Admin Sign In</h2>
              <p className="text-slate-400 text-sm">Authorised personnel only</p>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-xs text-rose-300 leading-relaxed">
              🔐 <strong>High privileged access.</strong> This panel is restricted to university administrators only. All actions are logged in the audit trail.
            </p>
          </div>

          <div className="mb-5 p-3 rounded-xl bg-slate-800/60 border border-white/10 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Demo admin:</span> admin@uniwell.edu / UniAdmin2024!
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input id="admin-email" type="email" placeholder="admin@sau.edu.in" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Input id="admin-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="pr-11" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button id="admin-login-submit" type="submit" size="lg" className="w-full bg-rose-700 hover:bg-rose-800 shadow-lg shadow-rose-500/20" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verifying…</span>
              ) : (
                <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Secure Sign In</span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-4 text-xs text-slate-600">
            <Link href="/login" className="hover:text-slate-400 transition-colors">← Student Portal</Link>
            <span>·</span>
            <Link href="/staff/login" className="hover:text-slate-400 transition-colors">Staff Portal</Link>
          </div>
          <p className="mt-4 text-center text-xs text-slate-700">UniWell Admin · Secured by Supabase</p>
        </div>
      </div>
    </div>
  );
}

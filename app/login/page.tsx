"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Eye, EyeOff, ArrowRight, Shield, Calendar, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("arjun@sau.edu.in");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, initAuth } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: "Missing fields", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (result.success) {
      toast({ title: "Welcome back! 👋", description: "Redirecting to your dashboard…", variant: "success" });
      router.replace("/dashboard");
    } else {
      toast({ title: "Login failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ─────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 p-12 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-80px] right-[-80px] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/40">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">UniWell</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Your health,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
              our priority.
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            SAU's integrated campus healthcare platform. Book appointments, manage insurance claims, and access emergency help — all in one place.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-4">
          {[
            { icon: Calendar, title: "Smart Appointments", desc: "Book with campus doctors instantly" },
            { icon: Shield, title: "Insurance Claims", desc: "Submit and track claims with ease" },
            { icon: FileText, title: "Health Records", desc: "All your health data in one dashboard" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 bg-white/5 border border-white/8 rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">{title}</p>
                <p className="text-slate-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel (form) ─────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">UniWell</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-slate-400 mb-8">Sign in to your student health portal.</p>

          {/* Demo credentials pill */}
          <div className="mb-6 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
            <span className="font-semibold">Demo:</span> arjun@sau.edu.in / password123
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@sau.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              id="login-submit"
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-600">
            SAU Campus Healthcare Portal · Secured
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { changePassword, isAuthenticated, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Redirect if not authenticated (meaning link was invalid or expired)
  useEffect(() => {
    if (isInitialized && !isAuthenticated && !isSuccess) {
      toast({ title: "Session Expired", description: "The reset link is invalid or has expired.", variant: "destructive" });
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, isSuccess, router, toast]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast({ title: "Weak password", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Matching Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const result = await changePassword(password);
    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
      toast({ title: "Password Updated", description: "Your credentials have been secured.", variant: "success" });
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        router.replace("/login");
      }, 3000);
    } else {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "#f7f9fb" }}>
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none select-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #005eb8, transparent)", filter: "blur(60px)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #cae2fe, transparent)", filter: "blur(60px)" }} />
      </div>

      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-[2.5rem] border border-[#eceef0] shadow-[0_8px_40px_rgba(25,28,30,0.06)] p-10 md:p-12">
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#00478d] text-white shadow-xl shadow-[#00478d]/20 mb-6 transition-transform hover:scale-105 duration-300">
              <Lock className="w-8 h-8" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight mb-3" style={{ fontFamily: 'var(--font-manrope)' }}>
              Set New Password
            </h1>
            <p className="text-sm font-semibold text-[#727783] leading-relaxed max-w-[280px]">
              {isSuccess 
                ? "Your identity has been re-verified. Redirecting you to sign in..." 
                : "Initialize your new secure credentials for the clinical platform."}
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2 relative">
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#727783] ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c2c6d4]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-[#f8fafc] border border-[#e0e3e5] rounded-2xl text-sm font-bold text-[#191c1e] placeholder-[#c2c6d4] focus:outline-none focus:border-[#005eb8] focus:ring-4 focus:ring-[#cae2fe] transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c2c6d4] hover:text-[#4a6078] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#727783] ml-1">Confirm Identity</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c2c6d4]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-[#f8fafc] border border-[#e0e3e5] rounded-2xl text-sm font-bold text-[#191c1e] placeholder-[#c2c6d4] focus:outline-none focus:border-[#005eb8] focus:ring-4 focus:ring-[#cae2fe] transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all shadow-[0_8px_20px_rgba(0,71,141,0.2)] hover:shadow-[0_12px_28px_rgba(0,71,141,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Secure Identity <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center py-4">
              <div className="w-20 h-20 rounded-full bg-[#f0fdf4] flex items-center justify-center mb-6 border border-[#dcfce7]">
                 <CheckCircle2 className="w-10 h-10 text-[#16a34a] animate-bounce" />
              </div>
              <p className="text-[#16a34a] text-xs font-black uppercase tracking-[0.3em]">Credentials Secured</p>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center text-[10px] font-bold text-[#c2c6d4] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            UniWell <div className="w-1 h-1 rounded-full bg-[#c2c6d4]/50" /> SHA-256 Protocol <div className="w-1 h-1 rounded-full bg-[#c2c6d4]/50" /> End-to-End
        </div>
      </div>
    </div>
  );
}

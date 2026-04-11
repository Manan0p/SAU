"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ArrowLeft, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    const result = await resetPassword(email);
    setIsLoading(false);

    if (result.success) {
      setIsSent(true);
      toast({ title: "Email Sent", description: "Please check your inbox for reset instructions.", variant: "success" });
    } else {
      toast({ title: "Request failed", description: result.error, variant: "destructive" });
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
              <ShieldCheck className="w-8 h-8" />
            </div>
            
            <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight mb-3" style={{ fontFamily: 'var(--font-manrope)' }}>
              Password Recovery
            </h1>
            <p className="text-sm font-semibold text-[#727783] leading-relaxed max-w-[280px]">
              {isSent 
                ? "We’ve sent a secure link to your email. It will expire in 1 hour." 
                : "Enter your registered campus email to receive a secure reset link."}
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2 relative">
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-[#727783] ml-1">Campus Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c2c6d4]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-[#f8fafc] border border-[#e0e3e5] rounded-2xl text-sm font-bold text-[#191c1e] placeholder-[#c2c6d4] focus:outline-none focus:border-[#005eb8] focus:ring-4 focus:ring-[#cae2fe] transition-all"
                    placeholder="name@sau.edu.in"
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
                  <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-5 bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl text-center">
                 <p className="text-[#16a34a] text-xs font-black uppercase tracking-widest">Email Dispatched Successfully</p>
              </div>
              
              <button
                onClick={() => setIsSent(false)}
                className="w-full py-4 rounded-2xl text-sm font-bold text-[#727783] bg-[#f8fafc] border border-[#e0e3e5] hover:bg-[#f1f5f9] transition-all"
              >
                Didn't receive it? Try again
              </button>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-[#eceef0] text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#005eb8] hover:text-[#00478d] transition-colors group">
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" /> 
              Back to Sign In
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-[#c2c6d4] uppercase tracking-[0.3em]">
            UniWell Secured Recovery System
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Eye, EyeOff, ArrowRight, Shield, Calendar, Stethoscope, UserCog, User, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";

type PortalMode = "none" | "student" | "staff" | "admin";

export default function LoginPage() {
  const [portal, setPortal] = useState<PortalMode>("none");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const { login, loginStaff, loginAdmin, loginWithGoogle, isAuthenticated, initAuth, isInitialized, hasRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Initialise auth on first load
  useEffect(() => {
    if (!isInitialized) initAuth();
  }, [initAuth, isInitialized]);

  // Route specifically once authenticated
  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    if (hasRole("admin")) {
      router.replace("/admin/dashboard");
    } else if (hasRole("doctor")) {
      router.replace("/staff/dashboard");
    } else if (hasRole("pharmacy")) {
      router.replace("/staff/pharmacy");
    } else if (hasRole("insurance")) {
      router.replace("/insurance-admin");
    } else if (hasRole("medical_center")) {
      router.replace("/sos/map");
    } else {
      router.replace("/student/dashboard");
    }
  }, [isInitialized, isAuthenticated, hasRole, router]);

  // Pre-fill mock emails when selecting a portal for demo purposes
  const handleSelectPortal = (selected: PortalMode) => {
    setPortal(selected);
    if (selected === "student") setEmail("arjun@sau.edu.in");
    if (selected === "staff") setEmail("doctor@sau.edu.in"); // Mock typical staff 
    if (selected === "admin") setEmail("admin@sau.edu.in");
    setPassword("password123");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (portal === "student" && isSignUp) {
      toast({ title: "Email signup unsupported", description: "Please use Google Auth to sign up.", variant: "destructive" });
      return;
    }
    
    if (!email.trim() || !password.trim()) {
      toast({ title: "Missing fields", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    
    let result;
    if (portal === "admin") {
      result = await loginAdmin(email, password);
    } else if (portal === "staff") {
      result = await loginStaff(email, password);
    } else {
      result = await login(email, password);
    }
    
    setIsLoading(false);
    if (result.success) {
      toast({ title: "Authentication Success", description: "Securing your session…", variant: "success" });
    } else {
      toast({ title: "Login failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f7f9fb" }}>
      {/* ── Left panel (Hero graphic) ───────────────────────── */}
      <div 
        className="hidden lg:flex flex-col justify-between w-1/2 p-14 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #00274D 0%, #00478d 50%, #005eb8 100%)" }}
      >
        <div className="absolute top-[-150px] left-[-150px] w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #a9c7ff, transparent)", filter: "blur(40px)" }} />
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #cae2fe, transparent)", filter: "blur(40px)" }} />
        
        <div className="relative z-10 pt-4">
          <Link href="/">
            <div className="flex items-center gap-3 mb-24 cursor-pointer w-fit transition-transform hover:scale-105">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.2)]" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-2xl tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>UniWell</span>
            </div>
          </Link>
          
          <h1 className="text-[3.5rem] font-bold text-white leading-[1.1] mb-8" style={{ fontFamily: 'var(--font-manrope)' }}>
            Your health,<br />
            <span style={{ color: "#c8daff" }}>our priority.</span>
          </h1>
          
          <p className="text-lg leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.7)", fontFamily: 'var(--font-public-sans)' }}>
            SAU&apos;s integrated campus healthcare platform. Schedule visits, manage insurance claims, and access emergency help—all perfectly organized in one intuitive dashboard.
          </p>
        </div>
        
        <div className="relative z-10 grid grid-cols-1 gap-5 max-w-md pb-4">
          {[
            { icon: Calendar, title: "Smart Scheduling", desc: "Book with campus doctors instantly" },
            { icon: Shield, title: "Insurance Claims", desc: "Submit and track claims with ease" },
            { icon: Stethoscope, title: "Vital Records", desc: "All your health data safely encrypted" },
          ].map(({ icon: Icon, title }) => (
            <div key={title} className="flex items-center gap-5 p-5 rounded-2xl transition-all hover:bg-white/5 group border border-transparent hover:border-white/10" style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ background: "rgba(255,255,255,0.1)" }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-base" style={{ fontFamily: 'var(--font-manrope)' }}>{title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (Auth) ─────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <Link href="/">
          <button className="absolute top-8 right-8 text-sm font-semibold text-[#727783] hover:text-[#191c1e] transition-colors flex items-center gap-2">
            Back to site <ArrowRight className="w-4 h-4" />
          </button>
        </Link>

        {portal === "none" ? (
          /* PORTAL SELECTION UI */
          <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#191c1e] mb-3 tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Access Portals</h2>
              <p className="text-sm font-medium text-[#727783]" style={{ fontFamily: 'var(--font-public-sans)' }}>Select your appropriate role to sign in</p>
            </div>

            <div className="grid gap-4">
              <button 
                onClick={() => handleSelectPortal("student")}
                className="w-full group bg-white border border-[#eceef0] p-6 rounded-[1.25rem] shadow-[0_2px_12px_rgba(25,28,30,0.04)] hover:shadow-[0_8px_24px_rgba(0,94,184,0.08)] hover:border-[#cae2fe] transition-all text-left flex items-center gap-5"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#f2f4f6] group-hover:bg-[#d6e3ff] transition-colors shrink-0">
                  <User className="w-6 h-6 text-[#4a6078] group-hover:text-[#00478d] transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#191c1e] mb-1" style={{ fontFamily: 'var(--font-manrope)' }}>Student Portal</h3>
                  <p className="text-xs font-semibold text-[#727783]">Appointments, insurance, & medical records</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#c2c6d4] group-hover:text-[#005eb8] transform group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => handleSelectPortal("staff")}
                className="w-full group bg-white border border-[#eceef0] p-6 rounded-[1.25rem] shadow-[0_2px_12px_rgba(25,28,30,0.04)] hover:shadow-[0_8px_24px_rgba(0,94,184,0.08)] hover:border-[#cae2fe] transition-all text-left flex items-center gap-5"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#f2f4f6] group-hover:bg-[#d6e3ff] transition-colors shrink-0">
                  <Stethoscope className="w-6 h-6 text-[#4a6078] group-hover:text-[#00478d] transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#191c1e] mb-1" style={{ fontFamily: 'var(--font-manrope)' }}>Staff Portal</h3>
                  <p className="text-xs font-semibold text-[#727783]">Doctors, pharmacy, & health center staff</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#c2c6d4] group-hover:text-[#005eb8] transform group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => handleSelectPortal("admin")}
                className="w-full group bg-white border border-[#eceef0] p-6 rounded-[1.25rem] shadow-[0_2px_12px_rgba(25,28,30,0.04)] hover:shadow-[0_8px_24px_rgba(0,94,184,0.08)] hover:border-[#cae2fe] transition-all text-left flex items-center gap-5"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#f2f4f6] group-hover:bg-[#ffdad6] transition-colors shrink-0">
                  <UserCog className="w-6 h-6 text-[#4a6078] group-hover:text-[#ba1a1a] transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#191c1e] mb-1" style={{ fontFamily: 'var(--font-manrope)' }}>Admin Portal</h3>
                  <p className="text-xs font-semibold text-[#727783]">Platform management & health analytics</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#c2c6d4] group-hover:text-[#ba1a1a] transform group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        ) : (
          /* LOGIN FORM UI */
          <div className="w-full max-w-[400px] animate-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setPortal("none")}
              className="flex items-center gap-2 text-sm font-semibold text-[#727783] hover:text-[#00478d] transition-colors mb-10"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Portals
            </button>

            <div className="mb-10">
              <h2 className="text-3xl font-bold text-[#191c1e] mb-3 tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>
                {portal === "student" ? (isSignUp ? "Student Sign Up" : "Welcome Student") : portal === "staff" ? "Staff Login" : "Admin Authentication"}
              </h2>
              <p className="text-sm font-medium text-[#727783]" style={{ fontFamily: 'var(--font-public-sans)' }}>
                {portal === "student" && isSignUp ? "Create your account to access the clinical portal." : "Please sign in to securely access the clinical portal."}
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2 relative">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">Campus Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white border border-[#e0e3e5] rounded-xl text-sm font-medium text-[#191c1e] placeholder-[#c2c6d4] focus:outline-none focus:border-[#005eb8] focus:ring-4 focus:ring-[#cae2fe] transition-all shadow-sm"
                  placeholder="name@sau.edu.in"
                  required
                />
              </div>

              <div className="space-y-2 relative">
                <div className="flex items-center justify-between ml-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#727783]">Password</label>
                  <Link href="/auth/forgot-password" title="Recover your password" className="text-xs font-bold text-[#005eb8] hover:text-[#00478d]">Forgot?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white border border-[#e0e3e5] rounded-xl text-sm font-medium text-[#191c1e] placeholder-[#c2c6d4] focus:outline-none focus:border-[#005eb8] focus:ring-4 focus:ring-[#cae2fe] transition-all shadow-sm pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a8adb8] hover:text-[#4a6078] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold text-white transition-all shadow-[0_4px_16px_rgba(0,94,184,0.2)] hover:shadow-[0_8px_24px_rgba(0,94,184,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-4"
                style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {portal === "student" && isSignUp ? "Sign Up Securely" : "Sign In Securely"} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {portal === "student" && (
              <div className="mt-6 flex flex-col gap-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#eceef0]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#f7f9fb] px-2 text-[#727783] uppercase font-bold tracking-widest">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-bold text-[#191c1e] bg-white border border-[#e0e3e5] hover:bg-[#f2f4f6] transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {isSignUp ? "Sign Up with Google" : "Sign In with Google"}
                </button>

                <div className="text-center text-sm font-medium text-[#727783] mt-2">
                  {isSignUp ? "Already have an account? " : "Don't have an account? "}
                  <button 
                    type="button" 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-[#005eb8] hover:text-[#00478d] font-bold transition-colors"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </div>
              </div>
            )}
          </div>

        )}
      </div>
    </div>
  );
}

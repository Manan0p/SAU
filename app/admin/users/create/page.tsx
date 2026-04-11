"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";

export default function CreateUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    college_id: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("No active session");

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create user");

      toast({ title: "Success", description: "User identity securely provisioned.", variant: "success" });
      router.push("/admin/users");
    } catch (err: unknown) {
      toast({ title: "Creation Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 p-10 max-w-4xl mx-auto space-y-8" style={{ background: "#f7f9fb" }}>
      <button 
        onClick={() => router.push("/admin/users")}
        className="flex items-center gap-2 text-sm font-semibold text-[#727783] hover:text-[#00478d] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Registry
      </button>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#00478d] text-white shadow-xl shadow-[#00478d]/20 transition-transform hover:scale-105 duration-300">
              <UserPlus className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Provision Identity</h1>
              <p className="text-[#727783] font-semibold mt-1 flex items-center gap-2">
                 Secure Profile Creation Dashboard
              </p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 border border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.06)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">Full Name</label>
              <Input 
                 required 
                 name="name" 
                 value={formData.name} 
                 onChange={handleChange} 
                 placeholder="Arjun Sharma" 
                 className="h-12 rounded-xl bg-[#f7f9fb] border-[#eceef0] focus-visible:ring-[#00478d] placeholder:text-[#c2c6d4]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">Email Address</label>
              <Input 
                 required 
                 type="email" 
                 name="email" 
                 value={formData.email} 
                 onChange={handleChange} 
                 placeholder="arjun@uniwell.edu" 
                 className="h-12 rounded-xl bg-[#f7f9fb] border-[#eceef0] focus-visible:ring-[#00478d] placeholder:text-[#c2c6d4]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">Temporary Password</label>
               <Input 
                  required 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="••••••••" 
                  minLength={6} 
                  className="h-12 rounded-xl bg-[#f7f9fb] border-[#eceef0] focus-visible:ring-[#00478d] placeholder:text-[#c2c6d4]"
               />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">College/Staff ID (Optional)</label>
               <Input 
                  name="college_id" 
                  value={formData.college_id} 
                  onChange={handleChange} 
                  placeholder="UNI-12345" 
                  className="h-12 rounded-xl bg-[#f7f9fb] border-[#eceef0] focus-visible:ring-[#00478d] placeholder:text-[#c2c6d4]"
               />
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">Platform Role</label>
             <div className="relative">
               <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange}
                  className="w-full px-4 h-12 bg-[#f7f9fb] border border-[#eceef0] rounded-xl text-sm font-semibold text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#00478d] focus:border-transparent transition-all appearance-none"
               >
                  <option value="student">Student</option>
                  <option value="doctor">Doctor</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="insurance">Insurance Staff</option>
                  <option value="medical_center">Medical Center Responder</option>
                  <option value="admin">Platform Admin</option>
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#727783]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
               </div>
             </div>
          </div>

          <div className="pt-8 border-t border-[#eceef0] flex justify-end">
             <button 
                type="submit" 
                disabled={loading}
                className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-sm font-bold text-white transition-all shadow-[0_4px_16px_rgba(0,94,184,0.2)] hover:shadow-[0_8px_24px_rgba(0,94,184,0.3)] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
             >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Provision User <Shield className="w-4 h-4"/></>}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}

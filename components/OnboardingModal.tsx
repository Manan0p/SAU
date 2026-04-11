"use client";

import { useState, useEffect } from "react";
import { ArrowRight, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const { toast } = useToast();
  const { user, hasRole, refreshUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: user?.phone || "",
    college_id: user?.college_id || "",
    class: user?.class || "",
    branch: user?.branch || "",
    batch: user?.batch || "",
    blood_group: user?.blood_group || "",
    medical_conditions: user?.medical_conditions || "",
  });

  const isStudent = hasRole("student");

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        phone: user.phone || prev.phone,
        college_id: user.college_id || prev.college_id,
        class: user.class || prev.class,
        branch: user.branch || prev.branch,
        batch: user.batch || prev.batch,
        blood_group: user.blood_group || prev.blood_group,
        medical_conditions: user.medical_conditions || prev.medical_conditions,
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_skipped", "true");
    onComplete();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) throw error;

      await refreshUser(); // Update state
      toast({ title: "Success", description: "Profile completed successfully.", variant: "success" });
      onComplete();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ background: "rgba(25, 28, 30, 0.4)", backdropFilter: "blur(12px)" }}>
      <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-[#eceef0] shadow-[0_24px_48px_rgba(25,28,30,0.15)] animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8 sm:p-10 space-y-8">
           {/* Header */}
           <div className="flex items-start justify-between">
             <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#00478d] text-white shadow-xl shadow-[#00478d]/20">
                   <FileText className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-2xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Complete Your Profile</h2>
                   <p className="text-[#727783] text-sm font-semibold mt-1">
                      We need a few more details to set up your account.
                   </p>
                </div>
             </div>
           </div>

           {/* Content */}
           <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">Phone Number {isStudent && "*"}</label>
                 <Input 
                    required={isStudent} 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="+91 9800000000" 
                    className="h-11 rounded-xl bg-[#f7f9fb] border-[#eceef0] focus-visible:ring-[#00478d] placeholder:text-[#c2c6d4]"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">College/Staff ID {isStudent && "*"}</label>
                 <Input 
                    required={isStudent} 
                    name="college_id" 
                    value={formData.college_id} 
                    onChange={handleChange} 
                    placeholder="SAU/202x/..." 
                    className="h-11 rounded-xl bg-[#f7f9fb] border-[#eceef0] focus-visible:ring-[#00478d] placeholder:text-[#c2c6d4]"
                 />
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">Academic Year {isStudent && "*"}</label>
                  <div className="relative">
                    <select 
                       required={isStudent}
                       name="class" 
                       value={formData.class} 
                       onChange={handleChange}
                       className="w-full px-4 h-11 bg-[#f7f9fb] border border-[#eceef0] rounded-xl text-sm font-semibold text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#00478d] transition-all appearance-none"
                    >
                       <option value="" disabled>Select Year</option>
                       <option value="1st Year">1st Year</option>
                       <option value="2nd Year">2nd Year</option>
                       <option value="3rd Year">3rd Year</option>
                       <option value="4th Year">4th Year</option>
                       <option value="Post-Grad">Post-Grad</option>
                       <option value="Staff/Other">Staff / Other</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#727783]">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">Branch/Department {isStudent && "*"}</label>
                  <div className="relative">
                    <select 
                       required={isStudent}
                       name="branch" 
                       value={formData.branch} 
                       onChange={handleChange}
                       className="w-full px-4 h-11 bg-[#f7f9fb] border border-[#eceef0] rounded-xl text-sm font-semibold text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#00478d] transition-all appearance-none"
                    >
                       <option value="" disabled>Select Branch</option>
                       <option value="B.Tech CSE">B.Tech CSE</option>
                       <option value="B.Tech ECE">B.Tech ECE</option>
                       <option value="B.Sc Physics">B.Sc Physics</option>
                       <option value="B.Sc Mathematics">B.Sc Mathematics</option>
                       <option value="BBA">BBA</option>
                       <option value="B.Com">B.Com</option>
                       <option value="LLB">LLB</option>
                       <option value="General Staff">General Staff</option>
                       <option value="Other">Other</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#727783]">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">Batch {isStudent && "*"}</label>
                  <div className="relative">
                    <select 
                       required={isStudent}
                       name="batch" 
                       value={formData.batch} 
                       onChange={handleChange}
                       className="w-full px-4 h-11 bg-[#f7f9fb] border border-[#eceef0] rounded-xl text-sm font-semibold text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#00478d] transition-all appearance-none"
                    >
                       <option value="" disabled>Select Batch</option>
                       <option value="2021-2025">2021-2025</option>
                       <option value="2022-2026">2022-2026</option>
                       <option value="2023-2027">2023-2027</option>
                       <option value="2024-2028">2024-2028</option>
                       <option value="2025-2029">2025-2029</option>
                       <option value="N/A">Not Applicable</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#727783]">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">Blood Group {isStudent && "*"}</label>
                  <div className="relative">
                    <select 
                       required={isStudent}
                       name="blood_group" 
                       value={formData.blood_group} 
                       onChange={handleChange}
                       className="w-full px-4 h-11 bg-[#f7f9fb] border border-[#eceef0] rounded-xl text-sm font-semibold text-[#191c1e] focus:outline-none focus:ring-2 focus:ring-[#00478d] transition-all appearance-none"
                    >
                       <option value="" disabled>Select</option>
                       <option value="A+">A+</option>
                       <option value="A-">A-</option>
                       <option value="B+">B+</option>
                       <option value="B-">B-</option>
                       <option value="AB+">AB+</option>
                       <option value="AB-">AB-</option>
                       <option value="O+">O+</option>
                       <option value="O-">O-</option>
                       <option value="Unknown">Unknown</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#727783]">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-xs font-bold uppercase tracking-widest text-[#727783] ml-1">Medical Conditions (Optional)</label>
               <Input 
                  name="medical_conditions" 
                  value={formData.medical_conditions} 
                  onChange={handleChange} 
                  placeholder="e.g. Asthma, Peanut Allergy, None" 
                  className="h-11 rounded-xl bg-[#f7f9fb] border-[#eceef0] focus-visible:ring-[#00478d] placeholder:text-[#c2c6d4]"
               />
             </div>

             <div className="pt-6 border-t border-[#eceef0] flex items-center justify-between">
                {!isStudent ? (
                   <button 
                     type="button" 
                     onClick={handleSkip}
                     className="text-sm font-bold text-[#727783] hover:text-[#191c1e] transition-colors"
                   >
                     Skip for now
                   </button>
                ) : (
                   <div />
                )}
                
                <button 
                   type="submit" 
                   disabled={loading}
                   className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-[0_4px_16px_rgba(0,94,184,0.2)] hover:shadow-[0_8px_24px_rgba(0,94,184,0.3)] disabled:opacity-50"
                   style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
                >
                   {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4"/></>}
                </button>
             </div>
           </form>
        </div>
      </div>
    </div>
  );
}

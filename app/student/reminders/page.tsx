"use client";

import React, { useState, useEffect } from "react";
import { UploadCloud, Clock, Pill, Loader2, Save, Trash2, CheckCircle2, Activity, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/button";

interface Schedule {
  id?: string;
  medicine_name: string;
  dosage: string;
  times_of_day: string[];
}

export default function RemindersPage() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Manual Entry States
  const [manualName, setManualName] = useState("");
  const [manualDosage, setManualDosage] = useState("");
  const [manualTimes, setManualTimes] = useState("");

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("medication_schedules")
        .select("*")
        .eq("userId", session.user.id)
        .eq("active", true);

      if (!error && data) {
        setSchedules(data as Schedule[]);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const extractPrescription = async () => {
    if (!file) return;
    setIsExtracting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract-prescription", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to extract");

      if (data.medications && Array.isArray(data.medications)) {
        setSchedules((prev) => [...prev, ...data.medications]);
        toast({ title: "Extraction Complete", description: "Found " + data.medications.length + " medications.", variant: "success" });
      }
    } catch (error: any) {
      toast({ title: "OCR Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  };

  const removeSchedule = async (index: number, scheduleId?: string) => {
    if (scheduleId) {
      await supabase.from("medication_schedules").update({ active: false }).eq("id", scheduleId);
    }
    const newSchedules = [...schedules];
    newSchedules.splice(index, 1);
    setSchedules(newSchedules);
  };

  const addManualSchedule = () => {
    if (!manualName.trim()) {
      toast({ title: "Validation Error", description: "Medicine name is required.", variant: "destructive" });
      return;
    }
    const times = manualTimes.split(",").map(t => t.trim()).filter(Boolean);
    if (times.length === 0) {
      toast({ title: "Validation Error", description: "Add at least one time.", variant: "destructive" });
      return;
    }
    setSchedules(prev => [...prev, {
      medicine_name: manualName.trim(),
      dosage: manualDosage.trim() || "As needed",
      times_of_day: times
    }]);
    setManualName("");
    setManualDosage("");
    setManualTimes("");
  };

  const saveSchedulesToDB = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const newSchedules = schedules.filter(s => !s.id).map(s => ({
        userId,
        medicine_name: s.medicine_name,
        dosage: s.dosage,
        times_of_day: s.times_of_day,
        active: true
      }));

      if (newSchedules.length > 0) {
        const { error } = await supabase.from("medication_schedules").insert(newSchedules);
        if (error) throw error;
      }
      
      toast({ title: "Saved!", description: "Your medication reminders look good.", variant: "success" });
      window.location.reload();
    } catch(err: any) {
      toast({ title: "Save Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center min-h-[50vh] items-center bg-[#f7f9fb]"><Loader2 className="animate-spin w-8 h-8 text-[#005eb8]" /></div>;
  }

  return (
    <div className="p-10 max-w-5xl mx-auto pb-32" style={{ background: "#f7f9fb", minHeight: "100vh" }}>
      
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#ffdbcb" }}>
          <Activity className="w-5 h-5 text-[#793100]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Medication Reminders</h1>
          <p className="text-sm font-medium" style={{ color: "#727783", fontFamily: "var(--font-public-sans)" }}>Add medications manually or upload a prescription.</p>
        </div>
      </div>
      <div className="mb-10" />

      {/* Manual Entry Section (Primary) */}
      <div className="rounded-3xl p-6 mb-8 transition-all duration-300 shadow-[0_2px_12px_rgba(25,28,30,0.04)]" style={{ background: "#ffffff" }}>
        <h3 className="text-lg font-semibold text-[#191C1E] mb-5 flex items-center gap-2" style={{ fontFamily: "var(--font-manrope)" }}>
          <Pill className="w-5 h-5 text-[#005eb8]" /> Manually Add Medication
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#727783] mb-1.5" style={{ fontFamily: "var(--font-public-sans)" }}>Medicine Name</label>
            <input 
              value={manualName} 
              onChange={e => setManualName(e.target.value)} 
              placeholder="e.g. Paracetamol"
              className="w-full bg-[#f7f9fb] border-none rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:ring-2 focus:ring-[#d6e3ff] transition-all"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#727783] mb-1.5" style={{ fontFamily: "var(--font-public-sans)" }}>Dosage</label>
            <input 
              value={manualDosage} 
              onChange={e => setManualDosage(e.target.value)} 
              placeholder="e.g. 500mg"
              className="w-full bg-[#f7f9fb] border-none rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:ring-2 focus:ring-[#d6e3ff] transition-all"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#727783] mb-1.5" style={{ fontFamily: "var(--font-public-sans)" }}>Times</label>
            <input 
              value={manualTimes} 
              onChange={e => setManualTimes(e.target.value)} 
              placeholder="09:00, 21:00"
              className="w-full bg-[#f7f9fb] border-none rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:ring-2 focus:ring-[#d6e3ff] transition-all"
            />
          </div>
          <div className="md:col-span-1">
            <button 
              onClick={addManualSchedule}
              className="w-full text-sm font-semibold text-white rounded-xl py-3 px-4 shadow-[0_4px_16px_rgba(0,94,184,0.15)] transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
            >
              Add to List
            </button>
          </div>
        </div>
      </div>

      {/* Upload Section (Secondary) */}
      <div 
        className="rounded-3xl p-6 mb-10 border border-[#e0e3e5] border-dashed bg-[#ffffff] flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-5 text-left">
          <div className="w-14 h-14 bg-[#eceef0] rounded-2xl flex items-center justify-center shrink-0">
            <UploadCloud className="w-6 h-6 text-[#727783]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>Have a physical prescription?</h3>
            <p className="text-sm text-[#727783]" style={{ fontFamily: "var(--font-public-sans)" }}>
              Upload it and our AI will automatically extract the medicine names and details.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 bg-[#f7f9fb] p-2 rounded-2xl border border-[#eceef0]">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="block w-full text-xs text-[#727783] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#ffffff] file:text-[#005eb8] hover:file:bg-[#eceef0] file:shadow-sm"
          />
          <button 
            onClick={extractPrescription} 
            disabled={!file || isExtracting}
            className="flex items-center justify-center shrink-0 w-10 h-10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#d6e3ff", color: "#00478d" }}
          >
            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin text-[#00478d]" /> : <ArrowRight className="w-4 h-4 text-[#00478d]" />}
          </button>
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6 px-1">
           <h3 className="text-xl font-semibold text-[#191c1e] flex items-center gap-2" style={{ fontFamily: 'var(--font-manrope)' }}>
             <Clock className="w-5 h-5 text-[#00478d]" /> Your Scheduled Meds
           </h3>
           <button 
              onClick={saveSchedulesToDB} 
              disabled={isSaving || schedules.length === 0}
              className="flex items-center gap-2 text-sm font-semibold rounded-xl py-2.5 px-5 transition-all text-[#00478d] bg-[#cae2fe] hover:bg-[#d6e3ff] disabled:opacity-50"
            >
             {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-[#00478d]" /> : <Save className="w-4 h-4" />} Save Changes
           </button>
        </div>

        {schedules.length === 0 ? (
          <div className="p-12 rounded-3xl text-center flex flex-col items-center" style={{ background: "#f2f4f6" }}>
            <div className="w-16 h-16 bg-[#e0e3e5] rounded-2xl flex items-center justify-center mb-4">
               <Pill className="w-6 h-6 text-[#727783]" />
            </div>
            <p className="text-base font-semibold text-[#424752] mb-1">No medications found</p>
            <p className="text-sm text-[#727783] max-w-sm">
              Your active medication schedule is currently empty. Add medicines manually above or upload an image of your prescription.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {schedules.map((schedule, i) => (
              <div 
                key={schedule.id || i} 
                className="bg-white rounded-3xl p-6 flex flex-col relative overflow-hidden group shadow-[0_2px_12px_rgba(25,28,30,0.04)]"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {/* Accent line replacing the border */}
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background: "linear-gradient(to bottom, #cae2fe, #005eb8)" }} />
                
                <div className="flex justify-between items-start mb-5 pl-2">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#d6e3ff] rounded-xl text-[#005eb8] flex items-center justify-center shadow-sm">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>{schedule.medicine_name}</h4>
                      <p className="text-sm font-medium text-[#727783]" style={{ fontFamily: "var(--font-public-sans)" }}>{schedule.dosage}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeSchedule(i, schedule.id)} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#f7f9fb] text-[#c2c6d4] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="bg-[#f7f9fb] rounded-2xl p-3.5 mt-auto pl-2 flex flex-wrap gap-2 items-center">
                  <Clock className="w-4 h-4 text-[#727783] ml-2 mr-1" />
                  {schedule.times_of_day.map((time, j) => (
                    <span 
                      key={j} 
                      className="text-[11px] font-mono font-bold px-2.5 py-1 text-[#001b3d] rounded-lg bg-[#ffffff] shadow-sm border border-[#e0e3e5]"
                    >
                      {time}
                    </span>
                  ))}
                  {schedule.id && (
                    <div className="ml-auto bg-[#e6e8ea] w-6 h-6 rounded-full flex items-center justify-center">
                       <CheckCircle2 className="w-4 h-4 text-[#005eb8]" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

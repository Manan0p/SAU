"use client";

import React, { useState, useEffect } from "react";
import { UploadCloud, Clock, Pill, Loader2, Save, Trash2, CheckCircle2 } from "lucide-react";
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
      // Find new schedules (no id yet)
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
      // Reload page to get fresh IDs
      window.location.reload();
    } catch(err: any) {
      toast({ title: "Save Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-emerald-500" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto pb-32">
      <h1 className="text-3xl font-light text-emerald-400 mb-2 tracking-tight">Medication Reminders</h1>
      <p className="text-slate-400 mb-8">Add medications manually or upload a prescription to receive web app & email alerts.</p>

      {/* Manual Entry Section (Primary) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5 text-emerald-500" /> Manually Add Medication
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Medicine Name</label>
            <input 
              value={manualName} 
              onChange={e => setManualName(e.target.value)} 
              placeholder="e.g. Paracetamol"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Dosage</label>
            <input 
              value={manualDosage} 
              onChange={e => setManualDosage(e.target.value)} 
              placeholder="e.g. 500mg"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Times (comma separated)</label>
            <input 
              value={manualTimes} 
              onChange={e => setManualTimes(e.target.value)} 
              placeholder="e.g. 09:00, 21:00"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-1 flex items-end">
            <Button onClick={addManualSchedule} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
              Add to List
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Section (Secondary) */}
      <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-6 mb-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="p-3 bg-slate-800 rounded-full">
            <UploadCloud className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="text-md font-medium text-slate-200">Have a physical prescription?</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Upload it and our AI will automatically extract the medicine names and schedule them for you.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 min-w-[240px]">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700"
          />
          <Button 
            onClick={extractPrescription} 
            disabled={!file || isExtracting}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 w-full"
            variant="outline"
          >
            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Auto-Scan Image
          </Button>
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-medium text-slate-200 flex items-center gap-2">
             <Clock className="w-5 h-5 text-emerald-500" /> Your Scheduled Meds
           </h3>
           <Button onClick={saveSchedulesToDB} disabled={isSaving || schedules.length === 0} className="bg-blue-600 hover:bg-blue-500 text-white">
             {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
           </Button>
        </div>

        {schedules.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500">
            No medications scheduled yet. Upload a prescription above!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {schedules.map((schedule, i) => (
              <div key={schedule.id || i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
                <div className="flex justify-between items-start mb-4 pl-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-1">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-slate-200">{schedule.medicine_name}</h4>
                      <p className="text-sm text-slate-400">{schedule.dosage}</p>
                    </div>
                  </div>
                  <button onClick={() => removeSchedule(i, schedule.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="bg-slate-950 rounded-lg p-3 mt-auto pl-3 border border-slate-800/50 flex flex-wrap gap-2 items-center">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {schedule.times_of_day.map((time, j) => (
                    <span key={j} className="text-xs font-mono font-medium px-2 py-1 bg-slate-800 text-slate-300 rounded-md">
                      {time}
                    </span>
                  ))}
                  {schedule.id && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

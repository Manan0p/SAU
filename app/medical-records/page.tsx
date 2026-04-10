"use client";

import { useEffect, useState, useCallback } from "react";
import { FileSearch, Plus, Stethoscope, User, RefreshCw, ChevronRight, Calendar, Activity, Pill, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getMyMedicalRecords, getAllMedicalRecords, createMedicalRecord } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDate, getInitials } from "@/lib/utils";
import type { MedicalRecord } from "@/types";
import { cn } from "@/lib/utils";

function MedicalRecordsContent() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  // Form state for doctor creating a record
  const [form, setForm] = useState({
    patientId: "",
    diagnosis: "",
    treatment: "",
    prescription: "",
    notes: "",
    visitDate: new Date().toISOString().slice(0, 10),
  });

  const isDoctor = hasRole("doctor") || hasRole("admin");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = isDoctor ? await getAllMedicalRecords() : await getMyMedicalRecords(user.id);
    setRecords(data);
    setLoading(false);
  }, [user, isDoctor]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.patientId || !form.diagnosis) {
      toast({ title: "Patient ID and diagnosis required", variant: "destructive" });
      return;
    }
    const result = await createMedicalRecord({
      patientId: form.patientId,
      doctorId: user.id,
      doctorName: user.name,
      diagnosis: form.diagnosis,
      treatment: form.treatment || undefined,
      prescription: form.prescription || undefined,
      notes: form.notes || undefined,
      visitDate: form.visitDate,
    });
    if (result.success) {
      toast({ title: "Medical record created ✓", variant: "success" });
      setAddOpen(false);
      setForm({ patientId: "", diagnosis: "", treatment: "", prescription: "", notes: "", visitDate: new Date().toISOString().slice(0, 10) });
      load();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#d6e3ff] text-[#00478d] border border-[#cae2fe] shadow-sm">
              <FileSearch className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>
                 Medical Archives
              </h1>
              <p className="text-[#727783] font-medium mt-1">
                {isDoctor ? "Access and manage clinical student health histories" : "View your official clinical health records"}
              </p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" onClick={load} className="gap-2 bg-white border-[#eceef0] hover:bg-[#f2f4f6]" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Sync
           </Button>
           {isDoctor && (
             <Button onClick={() => setAddOpen(true)} className="gap-2 bg-[#00478d] hover:bg-[#003a74] text-white rounded-xl h-10 px-5 shadow-lg shadow-[#00478d]/20">
               <Plus className="w-4 h-4" /> New Entry
             </Button>
           )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-4 border-[#005eb8] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#727783] text-sm font-medium">Securing records...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#eceef0] p-24 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#f7f9fb] flex items-center justify-center mx-auto mb-4 border border-[#eceef0]">
             <FileSearch className="w-8 h-8 text-[#c2c6d4]" />
          </div>
          <p className="text-[#727783] font-bold">No Records Found</p>
          <p className="text-[#727783] text-xs mt-1">Health history for this profile is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {records.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRecord(r)}
              className="text-left p-6 rounded-3xl bg-white border border-[#eceef0] hover:border-[#cae2fe] hover:bg-[#fcfdfe] transition-all duration-300 space-y-4 shadow-[0_2px_12px_rgba(25,28,30,0.04)] hover:shadow-lg group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#00478d] border border-[#eceef0] group-hover:bg-[#d6e3ff] transition-colors shadow-sm">
                    <span className="text-sm font-black">{getInitials(isDoctor ? (r.profiles?.name || "Patient") : r.doctorName.replace("Dr. ", ""))}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#191c1e]">
                      {isDoctor ? (r.profiles?.name || r.patientId) : r.doctorName}
                    </p>
                    <div className="flex items-center gap-1.5 text-[#727783] text-[11px] font-bold mt-0.5 uppercase tracking-wider">
                       <Calendar className="w-3 h-3" />
                       {formatDate(r.visitDate)}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#c2c6d4] group-hover:text-[#00478d] transition-colors" />
              </div>
              
              <div className="pt-2">
                <p className="text-xs font-bold text-[#727783] uppercase tracking-widest mb-1 opacity-60">Primary Diagnosis</p>
                <p className="text-sm font-extrabold text-[#424752] line-clamp-2 leading-relaxed h-[40px]">{r.diagnosis}</p>
              </div>

              {r.prescription && (
                <div className="flex items-center gap-2 pt-2">
                   <Badge className="text-[10px] bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7] font-bold uppercase tracking-wider py-0.5 px-2">
                      <Pill className="w-2.5 h-2.5 mr-1" />
                      Prescription
                   </Badge>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Record Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(o) => { if (!o) setSelectedRecord(null); }}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in-95">
          <div className="bg-[#00478d] p-8 text-white relative">
             <DialogTitle className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-manrope)' }}>Record Insights</DialogTitle>
             <DialogDescription className="text-[#cae2fe] font-medium mt-1 text-white/75">
                Clinical log from {selectedRecord ? formatDate(selectedRecord.visitDate) : ""}
             </DialogDescription>
             <div className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Activity className="w-6 h-6 text-white" />
             </div>
          </div>
          
          <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[70vh]">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f7f9fb] border border-[#eceef0]">
               <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#00478d] border border-[#eceef0] shadow-sm">
                  <UserCheck className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-[#727783] uppercase tracking-widest leading-none mb-1">{isDoctor ? "Patient Identity" : "Consulting Physician"}</p>
                  <p className="text-base font-bold text-[#191c1e]">
                    {isDoctor ? (selectedRecord?.profiles?.name || selectedRecord?.patientId) : selectedRecord?.doctorName}
                  </p>
               </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-[#727783] uppercase tracking-widest opacity-70">Clinical Diagnosis</p>
                <p className="text-[#191c1e] font-bold text-lg leading-tight">{selectedRecord?.diagnosis}</p>
              </div>

              {selectedRecord?.treatment && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-[#727783] uppercase tracking-widest opacity-70">Treatment Regimen</p>
                  <p className="text-[#424752] font-semibold leading-relaxed">{selectedRecord?.treatment}</p>
                </div>
              )}

              {selectedRecord?.prescription && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#727783] uppercase tracking-widest opacity-70">Medication Orders</p>
                  <div className="bg-[#f0fdf4] text-[#16a34a] font-mono text-xs p-4 rounded-2xl border border-[#dcfce7] leading-relaxed shadow-inner">
                    {selectedRecord?.prescription}
                  </div>
                </div>
              )}

              {selectedRecord?.notes && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-[#727783] uppercase tracking-widest opacity-70">Internal Physician Notes</p>
                  <div className="bg-[#fcfdfe] p-4 rounded-2xl border border-[#eceef0] italic text-[#727783] text-sm font-medium leading-relaxed">
                    "{selectedRecord?.notes}"
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="p-6 bg-[#fcfdfe] border-t border-[#eceef0] flex justify-end">
             <Button onClick={() => setSelectedRecord(null)} className="rounded-xl px-8 font-bold bg-[#191c1e] hover:bg-black text-white h-11">
                Close Record
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Record Dialog (doctors only) */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#00478d] p-8 text-white relative">
             <DialogTitle className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-manrope)' }}>New Entry</DialogTitle>
             <DialogDescription className="text-white/75 font-medium mt-1">Create an official clinical health record for a student</DialogDescription>
             <div className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Plus className="w-6 h-6 text-white" />
             </div>
          </div>
          <form onSubmit={handleCreate} className="p-8 space-y-5 bg-white">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5 col-span-1">
                 <Label className="text-xs font-bold text-[#191c1e] uppercase tracking-wide px-1">Patient UUID</Label>
                 <Input value={form.patientId} onChange={(e) => setForm(f => ({ ...f, patientId: e.target.value }))} placeholder="UUID..." required className="rounded-xl h-11 bg-[#f7f9fb] border-[#eceef0]" />
               </div>
               <div className="space-y-1.5 col-span-1">
                 <Label className="text-xs font-bold text-[#191c1e] uppercase tracking-wide px-1">Visit Date</Label>
                 <Input type="date" value={form.visitDate} onChange={(e) => setForm(f => ({ ...f, visitDate: e.target.value }))} required className="rounded-xl h-11 bg-[#f7f9fb] border-[#eceef0]" />
               </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#191c1e] uppercase tracking-wide px-1">Primary Diagnosis *</Label>
              <Input value={form.diagnosis} onChange={(e) => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="e.g. Viral infection" required className="rounded-xl h-11 bg-[#f7f9fb] border-[#eceef0]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#191c1e] uppercase tracking-wide px-1">Treatment Regimen</Label>
              <Input value={form.treatment} onChange={(e) => setForm(f => ({ ...f, treatment: e.target.value }))} placeholder="e.g. Fluids and rest" className="rounded-xl h-11 bg-[#f7f9fb] border-[#eceef0]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#191c1e] uppercase tracking-wide px-1">Medication Orders</Label>
              <textarea
                className="w-full rounded-2xl border border-[#eceef0] bg-[#f7f9fb] px-4 py-3 text-sm font-medium text-[#191c1e] placeholder:text-[#c2c6d4] focus:outline-none focus:ring-2 focus:ring-[#005eb8]/20 focus:border-[#005eb8] resize-none h-20"
                placeholder="Dosages, frequency, duration..."
                value={form.prescription}
                onChange={(e) => setForm(f => ({ ...f, prescription: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#191c1e] uppercase tracking-wide px-1">Internal Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observations..." className="rounded-xl h-11 bg-[#f7f9fb] border-[#eceef0]" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="rounded-xl font-bold text-[#727783]">Cancel</Button>
              <Button type="submit" className="rounded-xl px-10 font-bold bg-[#00478d] hover:bg-[#003a74] text-white h-11 shadow-lg shadow-[#00478d]/20">Store Record</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MedicalRecordsPage() {
  return <MedicalRecordsContent />;
}

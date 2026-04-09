"use client";

import { useEffect, useState, useCallback } from "react";
import { FileSearch, Plus, Stethoscope, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getMyMedicalRecords, getAllMedicalRecords, createMedicalRecord } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
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
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <FileSearch className="w-8 h-8 text-blue-400" />
            Medical Records
          </h1>
          <p className="text-slate-400">
            {isDoctor ? "All patient medical records" : "Your health history"}
          </p>
        </div>
        {isDoctor && (
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Record
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileSearch className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No medical records found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {records.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRecord(r)}
              className="text-left p-5 rounded-xl bg-slate-900 border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-200 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                    {getInitials(r.doctorName.replace("Dr. ", ""))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.doctorName}</p>
                    <p className="text-xs text-slate-500">{formatDate(r.visitDate)}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300 truncate">{r.diagnosis}</p>
                {r.treatment && <p className="text-xs text-slate-500 truncate mt-0.5">{r.treatment}</p>}
              </div>
              {r.prescription && (
                <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Prescription attached</Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Record Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(o) => { if (!o) setSelectedRecord(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Medical Record Details</DialogTitle>
            <DialogDescription>Visit on {selectedRecord ? formatDate(selectedRecord.visitDate) : ""}</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <Stethoscope className="w-5 h-5 text-violet-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Doctor</p>
                  <p className="text-white font-medium">{selectedRecord.doctorName}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase tracking-wide">Diagnosis</p>
                <p className="text-white">{selectedRecord.diagnosis}</p>
              </div>
              {selectedRecord.treatment && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Treatment</p>
                  <p className="text-white">{selectedRecord.treatment}</p>
                </div>
              )}
              {selectedRecord.prescription && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Prescription</p>
                  <p className="text-emerald-300 font-mono text-xs bg-emerald-500/10 p-3 rounded-lg">{selectedRecord.prescription}</p>
                </div>
              )}
              {selectedRecord.notes && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Notes</p>
                  <p className="text-slate-300 italic">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Record Dialog (doctors only) */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Medical Record</DialogTitle>
            <DialogDescription>Fill in the details for the patient visit.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Patient ID (UUID from profiles)</Label>
              <Input value={form.patientId} onChange={(e) => setForm(f => ({ ...f, patientId: e.target.value }))} placeholder="Patient's Supabase UUID" required />
            </div>
            <div className="space-y-1.5">
              <Label>Visit Date</Label>
              <Input type="date" value={form.visitDate} onChange={(e) => setForm(f => ({ ...f, visitDate: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Diagnosis *</Label>
              <Input value={form.diagnosis} onChange={(e) => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="e.g. Viral fever" required />
            </div>
            <div className="space-y-1.5">
              <Label>Treatment</Label>
              <Input value={form.treatment} onChange={(e) => setForm(f => ({ ...f, treatment: e.target.value }))} placeholder="e.g. Rest, fluids, paracetamol" />
            </div>
            <div className="space-y-1.5">
              <Label>Prescription</Label>
              <textarea
                className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                rows={2}
                placeholder="e.g. Paracetamol 500mg x3/day for 3 days"
                value={form.prescription}
                onChange={(e) => setForm(f => ({ ...f, prescription: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Additional Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Follow-up in 3 days if no improvement" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Create Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MedicalRecordsPage() {
  return <MedicalRecordsContent />;
}


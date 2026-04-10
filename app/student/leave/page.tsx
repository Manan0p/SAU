"use client";

import { useEffect, useState, useCallback } from "react";
import { FileClock, Plus, Calendar, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";

interface MedicalLeave {
  id: string;
  studentId: string;
  from_date: string;
  to_date: string;
  reason: string;
  supporting_doc_url?: string;
  status: "pending" | "approved" | "rejected";
  review_note?: string;
  created_at: string;
}

export default function MedicalLeavePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<MedicalLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    from_date: "",
    to_date: "",
    reason: "",
  });

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("medical_leave")
      .select("*")
      .eq("studentId", user.id)
      .order("created_at", { ascending: false });
    setLeaves((data ?? []) as MedicalLeave[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!user || !form.from_date || !form.to_date || !form.reason.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (new Date(form.to_date) < new Date(form.from_date)) {
      toast({ title: "End date must be after start date", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("medical_leave").insert([{
      studentId: user.id,
      from_date: form.from_date,
      to_date: form.to_date,
      reason: form.reason.trim(),
      status: "pending",
    }]);
    setSubmitting(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Leave application submitted ✓", description: "You will be notified once it is reviewed.", variant: "success" });
      setShowForm(false);
      setForm({ from_date: "", to_date: "", reason: "" });
      load();
    }
  };

  const statusConfig = {
    pending:  { icon: Clock,        variant: "warning"     as const, label: "Under Review" },
    approved: { icon: CheckCircle,  variant: "success"     as const, label: "Approved" },
    rejected: { icon: XCircle,      variant: "destructive" as const, label: "Rejected" },
  };

  const nights = (from: string, to: string) => {
    const diff = new Date(to).getTime() - new Date(from).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const pending = leaves.filter((l) => l.status === "pending").length;
  const approved = leaves.filter((l) => l.status === "approved").length;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <FileClock className="w-8 h-8 text-violet-400" />
            Medical Leave
          </h1>
          <p className="text-slate-400">Apply for medical leave and track your applications</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2" size="lg">
          <Plus className="w-4 h-4" /> Apply for Leave
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Applications", value: leaves.length, color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/10" },
          { label: "Under Review",       value: pending,        color: "text-amber-400",  border: "border-amber-500/20",  bg: "bg-amber-500/10" },
          { label: "Approved",           value: approved,       color: "text-emerald-400",border: "border-emerald-500/20",bg: "bg-emerald-500/10" },
        ].map(({ label, value, color, border, bg }) => (
          <Card key={label} className={`border ${border}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                <FileClock className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leave Applications */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Your Applications</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaves.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileClock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No leave applications yet</p>
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                Apply for Medical Leave
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaves.map((leave) => {
              const cfg = statusConfig[leave.status];
              const StatusIcon = cfg.icon;
              const duration = nights(leave.from_date, leave.to_date);
              return (
                <Card key={leave.id} className={`border ${
                  leave.status === "approved" ? "border-emerald-500/20" :
                  leave.status === "rejected" ? "border-red-500/20" : "border-violet-500/10"
                } hover:border-white/20 transition-all`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          leave.status === "approved" ? "bg-emerald-500/10" :
                          leave.status === "rejected" ? "bg-red-500/10" : "bg-violet-500/10"
                        }`}>
                          <StatusIcon className={`w-5 h-5 ${
                            leave.status === "approved" ? "text-emerald-400" :
                            leave.status === "rejected" ? "text-red-400" : "text-violet-400"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm">{leave.reason}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(leave.from_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              {" → "}
                              {new Date(leave.to_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className="bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                              {duration} day{duration !== 1 ? "s" : ""}
                            </span>
                          </div>
                          {leave.review_note && (
                            <p className={`text-xs mt-2 italic ${
                              leave.status === "approved" ? "text-emerald-400" :
                              leave.status === "rejected" ? "text-red-400" : "text-slate-500"
                            }`}>
                              Reviewer note: "{leave.review_note}"
                            </p>
                          )}
                          <p className="text-xs text-slate-600 mt-1">
                            Applied {new Date(leave.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={cfg.variant} className="shrink-0">{cfg.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for Medical Leave</DialogTitle>
            <DialogDescription>
              Fill in your leave details. Your application will be reviewed by the medical center.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="from-date">From Date *</Label>
                <Input
                  id="from-date"
                  type="date"
                  value={form.from_date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm((f) => ({ ...f, from_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to-date">To Date *</Label>
                <Input
                  id="to-date"
                  type="date"
                  value={form.to_date}
                  min={form.from_date || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setForm((f) => ({ ...f, to_date: e.target.value }))}
                />
              </div>
            </div>
            {form.from_date && form.to_date && new Date(form.to_date) >= new Date(form.from_date) && (
              <p className="text-xs text-violet-400">
                Duration: {nights(form.from_date, form.to_date)} day{nights(form.from_date, form.to_date) !== 1 ? "s" : ""}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason for Leave *</Label>
              <textarea
                id="reason"
                className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                rows={4}
                placeholder="e.g. Fever and doctor visit, post-surgery recovery, severe migraine requiring bed rest…"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
            <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <p className="text-xs text-violet-300 flex items-start gap-2">
                <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                A supporting document (doctor note / prescription) may be requested by the reviewer for extended leaves.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? "Submitting…" : <><Plus className="w-4 h-4" /> Submit Application</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

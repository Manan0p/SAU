"use client";

import { useEffect, useState, useCallback } from "react";
import { FileClock, CheckCircle, XCircle, Clock, RefreshCw, Calendar, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/hooks/useAuth";

interface LeaveApplication {
  id: string;
  studentId: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  review_note?: string;
  created_at: string;
  student_name?: string;
  student_email?: string;
}

export default function AdminLeavePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaveApplication | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    // Fetch leave applications + join student info
    const { data, error } = await supabase
      .from("medical_leave")
      .select("*, profiles!medical_leave_studentId_fkey(name, email)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLeaves(
        data.map((row: Record<string, unknown>) => ({
          ...(row as unknown as LeaveApplication),
          student_name: (row.profiles as Record<string, string>)?.name,
          student_email: (row.profiles as Record<string, string>)?.email,
        }))
      );
    } else {
      // Fallback: fetch without join if foreign key alias fails
      const { data: fallback } = await supabase
        .from("medical_leave")
        .select("*")
        .order("created_at", { ascending: false });
      setLeaves((fallback ?? []) as LeaveApplication[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleReview = async () => {
    if (!selected || !reviewAction) return;
    setSubmitting(true);
    const { error } = await supabase.from("medical_leave").update({
      status: reviewAction,
      review_note: reviewNote.trim() || null,
      reviewed_by: user?.id,
    }).eq("id", selected.id);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: reviewAction === "approved" ? "Leave approved ✓" : "Leave rejected",
        variant: reviewAction === "approved" ? "success" : "default",
      });
      setSelected(null);
      setReviewAction(null);
      setReviewNote("");
      load();
    }
  };

  const filtered = filter === "all" ? leaves : leaves.filter((l) => l.status === filter);
  const counts = {
    all: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  const nights = (from: string, to: string) => Math.max(0, Math.ceil(
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <FileClock className="w-8 h-8 text-violet-400" />
            Leave Review
          </h1>
          <p className="text-slate-400">Review and approve student medical leave applications</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { key: "all",      label: "Total",          color: "text-violet-400",  border: "border-violet-500/20" },
          { key: "pending",  label: "Pending Review", color: "text-amber-400",   border: "border-amber-500/20" },
          { key: "approved", label: "Approved",       color: "text-emerald-400", border: "border-emerald-500/20" },
          { key: "rejected", label: "Rejected",       color: "text-red-400",     border: "border-red-500/20" },
        ].map(({ key, label, color, border }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`text-left p-5 rounded-2xl border transition-all ${border} ${filter === key ? "bg-white/5" : "hover:bg-white/[0.02]"}`}
          >
            <p className={`text-2xl font-bold ${color}`}>{counts[key as keyof typeof counts]}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileClock className="w-4 h-4 text-violet-400" />
            {filter === "all" ? "All Applications" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Applications`}
            {" "}({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <FileClock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No {filter} applications</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <p className="font-medium text-sm text-white">{leave.student_name ?? "Unknown"}</p>
                      <p className="text-xs text-slate-500 font-mono">{leave.studentId.slice(0, 8)}…</p>
                    </TableCell>
                    <TableCell className="text-sm text-slate-300 max-w-[180px] truncate">{leave.reason}</TableCell>
                    <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(leave.from_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {" → "}
                      {new Date(leave.to_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {nights(leave.from_date, leave.to_date)} day{nights(leave.from_date, leave.to_date) !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(leave.created_at).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        leave.status === "approved" ? "success" :
                        leave.status === "rejected" ? "destructive" : "warning"
                      }>
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {leave.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 gap-1"
                            onClick={() => { setSelected(leave); setReviewAction("approved"); setReviewNote(""); }}
                          >
                            <CheckCircle className="w-3 h-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 gap-1"
                            onClick={() => { setSelected(leave); setReviewAction("rejected"); setReviewNote(""); }}
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </Button>
                        </div>
                      )}
                      {leave.status !== "pending" && leave.review_note && (
                        <p className="text-xs text-slate-600 italic max-w-[160px] truncate">"{leave.review_note}"</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setReviewAction(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approved" ? "Approve Leave Application" : "Reject Leave Application"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approved"
                ? "The student will be notified that their leave has been approved."
                : "Please provide a reason for rejection to inform the student."}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-sm text-white">{selected.student_name ?? selected.studentId.slice(0, 8)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-sm text-slate-300">
                    {new Date(selected.from_date).toLocaleDateString("en-IN")} → {new Date(selected.to_date).toLocaleDateString("en-IN")}
                    {" "}({nights(selected.from_date, selected.to_date)} day{nights(selected.from_date, selected.to_date) !== 1 ? "s" : ""})
                  </p>
                </div>
                <p className="text-sm text-slate-400 italic">"{selected.reason}"</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review-note">
                  {reviewAction === "approved" ? "Note (optional)" : "Reason for Rejection *"}
                </Label>
                <textarea
                  id="review-note"
                  className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={3}
                  placeholder={reviewAction === "approved" ? "Optional approval note…" : "Reason for rejection…"}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setSelected(null); setReviewAction(null); }}>Cancel</Button>
            <Button
              onClick={handleReview}
              disabled={submitting || (reviewAction === "rejected" && !reviewNote.trim())}
              className={reviewAction === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
            >
              {submitting ? "Processing…" : reviewAction === "approved" ? "✓ Approve" : "✕ Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { FileClock, CheckCircle, XCircle, Clock, RefreshCw, Calendar, User, ArrowRight, ShieldCheck, Mail, Ghost } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

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
    try {
      const { data, error } = await supabase
        .from("medical_leave")
        .select("*, profiles!medical_leave_studentId_fkey(name, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setLeaves(
        (data ?? []).map((row: any) => ({
          ...row,
          student_name: row.profiles?.name,
          student_email: row.profiles?.email,
        }))
      );
    } catch (e) {
      // Fallback: fetch without join
      const { data: fallback } = await supabase
        .from("medical_leave")
        .select("*")
        .order("created_at", { ascending: false });
      setLeaves((fallback ?? []) as LeaveApplication[]);
    } finally {
      setLoading(false);
    }
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
      toast({ title: "Operation Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: reviewAction === "approved" ? "Resolution Applied ✓" : "Resolution Applied",
        description: `Leave request has been ${reviewAction}.`,
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
    <div className="min-h-screen pb-20 p-10 max-w-7xl mx-auto space-y-10" style={{ background: "#f7f9fb" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#00478d] text-white shadow-xl shadow-[#00478d]/20 transition-transform hover:scale-105 duration-300">
              <FileClock className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Clinical Leave Review</h1>
              <p className="text-[#727783] font-semibold mt-1 flex items-center gap-2">
                 Protocol Oversight · <span className="text-[#00478d] font-bold">Authorized Dispatch</span>
              </p>
           </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl border border-[#eceef0] bg-white text-[#424752] hover:text-[#00478d] hover:bg-[#f7f9fb] text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> 
          Re-initialize Stream
        </button>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { key: "all",      label: "Total Flow",     value: counts.all,      color: "#00478d", bg: "#d6e3ff", border: "#cae2fe" },
          { key: "pending",  label: "Queue Priority", value: counts.pending,  color: "#d97706", bg: "#fffbeb", border: "#fef3c7" },
          { key: "approved", label: "Validated",      value: counts.approved, color: "#16a34a", bg: "#f0fdf4", border: "#dcfce7" },
          { key: "rejected", label: "Denied",         value: counts.rejected, color: "#dc2626", bg: "#fef2f2", border: "#fee2e2" },
        ].map(({ key, label, value, color, bg, border }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={cn(
               "text-left p-6 rounded-[2rem] border transition-all duration-300 group relative overflow-hidden",
               filter === key 
                 ? "bg-white border-[#00478d] shadow-xl shadow-[#00478d]/5" 
                 : "bg-[#fcfdfe] border-[#eceef0] hover:border-[#00478d]/20 shadow-sm"
            )}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border transition-transform group-hover:scale-110" style={{ background: bg, borderColor: border }}>
               <Clock className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-[#727783] text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-3xl font-black text-[#191c1e] leading-none" style={{ fontFamily: 'var(--font-manrope)' }}>{loading ? "—" : value}</p>
            {filter === key && <div className="absolute right-6 top-6 w-2 h-2 rounded-full bg-[#00478d]" />}
          </button>
        ))}
      </div>

      {/* Main Table Area */}
      <Card className="rounded-[2.5rem] border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.06)] overflow-hidden">
        <div className="px-10 py-8 border-b border-[#eceef0] flex items-center justify-between bg-[#fcfdfe]">
           <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#00478d]" />
              <h3 className="text-lg font-extrabold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>
                 Resolution Queue <span className="text-[#c2c6d4] font-bold ml-2">({filtered.length})</span>
              </h3>
           </div>
           <Badge variant="outline" className="font-black uppercase text-[9px] tracking-widest px-3 py-1 border-[#eceef0] bg-[#f7f9fb] text-[#727783]">
              {filter === "all" ? "Full Matrix" : `${filter} protocol`}
           </Badge>
        </div>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-12 h-12 border-4 border-[#00478d] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#727783] text-[10px] font-black uppercase tracking-[0.3em]">Accessing Clinical Stream...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-32 text-center bg-[#fcfdfe]">
              <div className="w-20 h-20 rounded-full bg-[#f7f9fb] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-[#eceef0]">
                 <Ghost className="w-8 h-8 text-[#c2c6d4]" />
              </div>
              <p className="text-[#191c1e] text-xl font-extrabold" style={{ fontFamily: 'var(--font-manrope)' }}>Empty Queue</p>
              <p className="text-[#727783] text-xs mt-2 font-bold uppercase tracking-widest opacity-80">No {filter} applications currently localized</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#fcfdfe]">
                <TableRow className="hover:bg-transparent border-[#eceef0]">
                  <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Requesting Unit</TableHead>
                  <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Symptom / Reason</TableHead>
                  <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Timeframe</TableHead>
                  <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Span</TableHead>
                  <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Status</TableHead>
                  <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783] text-right">Operational Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((leave) => (
                  <TableRow key={leave.id} className="group hover:bg-[#f7f9fb] transition-all border-[#eceef0]">
                    <TableCell className="px-10 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-[#f2f4f6] flex items-center justify-center text-[#00478d] font-black text-sm border border-[#eceef0] group-hover:bg-white transition-all shadow-sm">
                            {leave.student_name?.[0]?.toUpperCase() ?? "?"}
                         </div>
                         <div>
                            <p className="font-black text-[#191c1e] text-sm group-hover:text-[#00478d] transition-colors">{leave.student_name ?? "Incognito"}</p>
                            <p className="text-[10px] font-bold text-[#c2c6d4] mt-0.5 font-mono">{leave.studentId.slice(0, 12)}</p>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-6 max-w-[200px]">
                       <p className="text-sm text-[#424752] font-medium truncate italic">"{leave.reason}"</p>
                    </TableCell>
                    <TableCell className="px-6 py-6 text-[11px] font-bold text-[#727783] whitespace-nowrap">
                       {new Date(leave.from_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                       <ArrowRight className="w-3 h-3 inline mx-2 opacity-30" />
                       {new Date(leave.to_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="px-6 py-6">
                       <Badge variant="outline" className="bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd] font-black text-[9px] px-2.5 py-1">
                          {nights(leave.from_date, leave.to_date)} UNIT{nights(leave.from_date, leave.to_date) !== 1 ? "S" : ""}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-6">
                       <Badge className={cn(
                          "font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-lg border",
                          leave.status === "approved" ? "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]" :
                          leave.status === "rejected" ? "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]" : 
                          "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]"
                       )}>
                         {leave.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="px-10 py-6 text-right">
                      {leave.status === "pending" ? (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            className="bg-[#16a34a] hover:bg-[#15803d] text-white font-black text-[10px] uppercase tracking-widest px-4 h-9 rounded-xl shadow-lg shadow-[#16a34a]/10"
                            onClick={() => { setSelected(leave); setReviewAction("approved"); setReviewNote(""); }}
                          >
                             Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[#dc2626] border-[#fee2e2] bg-white hover:bg-[#fef2f2] font-black text-[10px] uppercase tracking-widest px-4 h-9 rounded-xl"
                            onClick={() => { setSelected(leave); setReviewAction("rejected"); setReviewNote(""); }}
                          >
                             Reject
                          </Button>
                        </div>
                      ) : (
                         <p className="text-[10px] font-bold text-[#c2c6d4] italic max-w-[160px] truncate ml-auto">
                            {leave.review_note ? `"${leave.review_note}"` : "No resolution payload"}
                         </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="p-10 bg-[#191c1e] rounded-[3rem] text-white shadow-2xl shadow-[#191c1e]/20 relative overflow-hidden group">
         <div className="absolute right-0 bottom-0 w-80 h-80 bg-[#00478d]/10 rounded-full translate-y-1/2 translate-x-1/2 blur-3xl" />
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
               <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase mb-3">Clinical Compliance v2.1</p>
               <h4 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Resolution Integrity Framework</h4>
               <p className="max-w-xl text-sm text-white/50 mt-3 font-medium leading-relaxed">
                  Decisions recorded here are transmitted immediately to student portals and institutional registrars. Ensure medical reason verification is performed prior to authorization.
               </p>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-[#16a34a]" />
               </div>
               <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Authenticated Audit Trail Active</p>
            </div>
         </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setReviewAction(null); } }}>
        <DialogContent className="rounded-[2.5rem] border-[#eceef0] bg-white shadow-2xl p-10 max-w-lg">
          <DialogHeader className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] flex items-center justify-center text-[#00478d] mb-6 border border-[#eceef0]">
               {reviewAction === "approved" ? <CheckCircle className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
            </div>
            <DialogTitle className="text-2xl font-black text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>
              {reviewAction === "approved" ? "Authorize Dispensation" : "Decline Application"}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#727783] font-medium mt-2">
              {reviewAction === "approved"
                ? "This action will validate the student's clinical absence and update the institutional registry."
                : "A reason payload is required for declining applications to maintain clinical transparency."}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[#f7f9fb] border border-[#eceef0] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#eceef0] flex items-center justify-center">
                    <User className="w-4 h-4 text-[#00478d]" />
                  </div>
                  <p className="font-bold text-[#191c1e] text-sm">{selected.student_name ?? selected.studentId.slice(0, 12)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#eceef0] flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                  <p className="text-xs text-[#727783] font-black uppercase tracking-widest">
                    {new Date(selected.from_date).toLocaleDateString("en-IN")} → {new Date(selected.to_date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#eceef0]">
                  <p className="text-xs text-[#727783] font-bold uppercase tracking-widest mb-2 opacity-50">Stated Etiology</p>
                  <p className="text-sm text-[#424752] italic font-medium leading-relaxed">"{selected.reason}"</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="review-note" className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">
                  Resolution Payload {reviewAction === "approved" ? "(Optional)" : "(Mandatory)"}
                </Label>
                <textarea
                  id="review-note"
                  className="w-full rounded-2xl border border-[#eceef0] bg-[#fcfdfe] px-5 py-4 text-sm text-[#191c1e] placeholder:text-[#c2c6d4] focus:outline-none focus:ring-2 focus:ring-[#00478d]/10 resize-none font-medium leading-relaxed"
                  rows={4}
                  placeholder={reviewAction === "approved" ? "Specify conditions or instructions for the student…" : "State the explicit clinical or administrative reason for decline…"}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-10 gap-3">
            <Button variant="ghost" onClick={() => { setSelected(null); setReviewAction(null); }} className="rounded-xl font-black uppercase text-[10px] tracking-widest text-[#727783]">Cancel Operation</Button>
            <Button
              onClick={handleReview}
              disabled={submitting || (reviewAction === "rejected" && !reviewNote.trim())}
              className={cn(
                "rounded-xl font-black uppercase text-[10px] tracking-widest px-8 shadow-lg",
                reviewAction === "approved" ? "bg-[#16a34a] hover:bg-[#15803d]" : "bg-[#dc2626] hover:bg-[#ba1a1a]"
              )}
            >
              {submitting ? "Processing…" : reviewAction === "approved" ? "Execute Approval" : "Execute Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

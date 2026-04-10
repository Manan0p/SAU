"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, CheckCircle, XCircle, Clock, IndianRupee, ChevronDown, RefreshCw, ArrowRight, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAllClaims } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import type { Claim } from "@/types";

function InsuranceAdminContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [reviewNote, setReviewNote] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllClaims();
    setClaims(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = claims.filter((c) => filter === "all" ? true : c.status === filter);

  const stats = {
    total: claims.length,
    pending: claims.filter((c) => c.status === "pending").length,
    approved: claims.filter((c) => c.status === "approved").length,
    rejected: claims.filter((c) => c.status === "rejected").length,
    totalValue: claims.filter((c) => c.status === "approved").reduce((s, c) => s + (c.approvedAmount ?? c.amount), 0),
  };

  const handleReview = async () => {
    if (!selectedClaim || !user) return;
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch("/api/insurance/claims", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        claimId: selectedClaim.id,
        status: reviewStatus,
        reviewNote,
        approvedAmount: reviewStatus === "approved" ? parseFloat(approvedAmount) || selectedClaim.amount : undefined,
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (json.success) {
      toast({
        title: reviewStatus === "approved" ? "✅ Claim Approved" : "❌ Claim Rejected",
        variant: reviewStatus === "approved" ? "success" : "destructive",
      });
      setSelectedClaim(null);
      setReviewNote("");
      setApprovedAmount("");
      load();
    } else {
      toast({ title: "Error", description: json.error, variant: "destructive" });
    }
  };

  const badgeVariant = (s: string) => s === "approved" ? "success" as const : s === "rejected" ? "destructive" as const : "warning" as const;

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#fffbeb] text-[#d97706] border border-[#fef3c7] shadow-sm">
              <ShieldCheck className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Claims Review</h1>
              <p className="text-[#727783] font-medium mt-1">Audit student medical insurance submissions and payouts</p>
           </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2 bg-white border-[#eceef0] hover:bg-[#f2f4f6]" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Registry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[
          { label: "Submissions", value: stats.total, icon: ShieldCheck, color: "#00478d", bg: "#d6e3ff", border: "#cae2fe" },
          { label: "Awaiting Help", value: stats.pending, icon: Clock, color: "#d97706", bg: "#fffbeb", border: "#fef3c7" },
          { label: "Clearance", value: stats.approved, icon: CheckCircle, color: "#16a34a", bg: "#f0fdf4", border: "#dcfce7" },
          { label: "Denied", value: stats.rejected, icon: XCircle, color: "#dc2626", bg: "#fef2f2", border: "#fee2e2" },
          { label: "Insurance Paid", value: `₹${stats.totalValue.toLocaleString()}`, icon: IndianRupee, color: "#7c3aed", bg: "#f5f3ff", border: "#ede9fe" },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className="bg-white rounded-3xl p-6 border border-[#eceef0] shadow-[0_2px_12px_rgba(25,28,30,0.04)] hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border" style={{ background: bg, borderColor: border }}>
              <Icon className="w-5 h-5" style={{ color: color }} />
            </div>
            <p className="text-[#727783] text-xs font-bold uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-bold text-[#191c1e] mt-1" style={{ fontFamily: 'var(--font-manrope)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-[#eceef0] shadow-[0_2px_12px_rgba(25,28,30,0.04)] overflow-hidden">
        {/* Table Header / Filters */}
        <div className="px-8 py-6 border-b border-[#eceef0] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#fcfdfe]">
          <div className="flex items-center gap-3">
             <Filter className="w-4 h-4 text-[#727783]" />
             <span className="text-sm font-bold text-[#424752] uppercase tracking-wider">Registry Filters</span>
          </div>
          <div className="flex bg-[#f2f4f6] p-1 rounded-xl">
            {(["all", "pending", "approved", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                  filter === f
                    ? "bg-white text-[#191c1e] shadow-sm"
                    : "text-[#727783] hover:text-[#191c1e]"
                )}
              >
                {f} {f === "pending" && stats.pending > 0 ? `(${stats.pending})` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
               <div className="w-10 h-10 border-4 border-[#005eb8] border-t-transparent rounded-full animate-spin" />
               <p className="text-[#727783] text-sm font-medium">Fetching clinical claims...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-[#f7f9fb] flex items-center justify-center mx-auto mb-4 border border-[#eceef0]">
                 <ShieldCheck className="w-8 h-8 text-[#c2c6d4]" />
              </div>
              <p className="text-[#727783] font-bold">No Records Found</p>
              <p className="text-[#727783] text-xs mt-1">There are no {filter === "all" ? "" : filter} claims in the current view.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#fcfdfe] hover:bg-[#fcfdfe] border-b border-[#eceef0]">
                  <TableHead className="py-4 font-bold text-[#727783] uppercase tracking-wider text-[10px] pl-8">Student Identifier</TableHead>
                  <TableHead className="py-4 font-bold text-[#727783] uppercase tracking-wider text-[10px]">Medical Concern</TableHead>
                  <TableHead className="py-4 font-bold text-[#727783] uppercase tracking-wider text-[10px]">Claim Amount</TableHead>
                  <TableHead className="py-4 font-bold text-[#727783] uppercase tracking-wider text-[10px]">Date Filed</TableHead>
                  <TableHead className="py-4 font-bold text-[#727783] uppercase tracking-wider text-[10px]">Status</TableHead>
                  <TableHead className="py-4 font-bold text-[#727783] uppercase tracking-wider text-[10px] text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-[#f7f9fb] transition-colors group">
                    <TableCell className="pl-8 font-mono text-xs font-bold text-[#005eb8]">{claim.userId.slice(0, 12).toUpperCase()}...</TableCell>
                    <TableCell className="max-w-[240px] truncate text-sm font-semibold text-[#191c1e]">{claim.description}</TableCell>
                    <TableCell className="font-bold text-[#191c1e]">{formatCurrency(claim.amount)}</TableCell>
                    <TableCell className="text-[#727783] text-[11px] font-bold">{formatDate(claim.createdAt)}</TableCell>
                    <TableCell>
                       <Badge variant={badgeVariant(claim.status)} className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold">
                          {claim.status}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      {claim.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setSelectedClaim(claim); setApprovedAmount(String(claim.amount)); setReviewStatus("approved"); }}
                          className="gap-2 text-xs font-bold text-[#005eb8] hover:bg-[#d6e3ff]/50 h-8 px-4 rounded-lg"
                        >
                          Review <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedClaim} onOpenChange={(o) => { if (!o) { setSelectedClaim(null); setReviewNote(""); setApprovedAmount(""); } }}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-[#00478d] p-8 text-white relative">
             <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'var(--font-manrope)' }}>Clinical Review</DialogTitle>
             <DialogDescription className="text-[#cae2fe] font-medium mt-1">
                Audit submission for internal ID: {selectedClaim?.id.slice(0, 8).toUpperCase()}
             </DialogDescription>
             <div className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <ShieldCheck className="w-6 h-6 text-white" />
             </div>
          </div>
          <div className="p-8 space-y-6 bg-white">
            <div className="p-4 rounded-2xl bg-[#f7f9fb] border border-[#eceef0]">
               <p className="text-[10px] font-bold text-[#727783] uppercase tracking-widest mb-1">Student Description</p>
               <p className="text-sm font-bold text-[#191c1e]">{selectedClaim?.description}</p>
               <div className="mt-3 pt-3 border-t border-[#eceef0] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#727783]">Total Amount Claimed:</span>
                  <span className="text-lg font-black text-[#191c1e]">{selectedClaim ? formatCurrency(selectedClaim.amount) : ""}</span>
               </div>
            </div>

            {/* Decision */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setReviewStatus("approved")}
                className={cn(
                  "py-4 rounded-2xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-2",
                  reviewStatus === "approved"
                    ? "bg-[#f0fdf4] border-[#16a34a] text-[#16a34a] shadow-sm"
                    : "border-[#eceef0] text-[#727783] hover:border-[#16a34a]/30"
                )}
              >
                <CheckCircle className="w-5 h-5" /> 
                Approve Claim
              </button>
              <button
                onClick={() => setReviewStatus("rejected")}
                className={cn(
                  "py-4 rounded-2xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-2",
                  reviewStatus === "rejected"
                    ? "bg-[#fef2f2] border-[#dc2626] text-[#dc2626] shadow-sm"
                    : "border-[#eceef0] text-[#727783] hover:border-[#dc2626]/30"
                )}
              >
                <XCircle className="w-5 h-5" />
                Reject Claim
              </button>
            </div>

            <div className="space-y-4">
              {reviewStatus === "approved" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#191c1e] px-1 uppercase tracking-wider">Approved Reimbursement (₹)</label>
                  <Input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    placeholder={String(selectedClaim?.amount)}
                    className="h-12 rounded-xl bg-[#f7f9fb] border-[#eceef0] focus:ring-[#005eb8] font-bold text-lg"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#191c1e] px-1 uppercase tracking-wider">Clinical Notes (Visible to Student)</label>
                <textarea
                  className="w-full rounded-xl border border-[#eceef0] bg-[#f7f9fb] px-4 py-3 text-sm font-medium text-[#191c1e] placeholder:text-[#c2c6d4] focus:outline-none focus:ring-2 focus:ring-[#005eb8]/20 focus:border-[#005eb8] resize-none h-24"
                  placeholder={reviewStatus === "approved" ? "The claim has been verified and approved for reimbursement." : "Submission rejected due to insufficient documentation..."}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="px-8 pb-8 pt-2 flex items-center justify-end gap-3 bg-white">
            <Button variant="ghost" onClick={() => setSelectedClaim(null)} className="font-bold text-[#727783] hover:bg-[#eceef0] rounded-xl px-6">
              Discard
            </Button>
            <Button
              onClick={handleReview}
              disabled={submitting}
              className={cn(
                "font-bold rounded-xl px-8 h-11 text-white shadow-lg transition-all",
                reviewStatus === "approved" ? "bg-[#16a34a] hover:bg-[#15803d]" : "bg-[#dc2626] hover:bg-[#b91c1c]"
              )}
            >
              {submitting ? "Processing..." : `Confirm ${reviewStatus === "approved" ? "Approval" : "Rejection"}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InsuranceAdminPage() {
  return <InsuranceAdminContent />;
}

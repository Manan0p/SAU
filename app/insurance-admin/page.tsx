"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, CheckCircle, XCircle, Clock, IndianRupee, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAllClaims } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDate, formatCurrency } from "@/lib/utils";
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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          Claims Review
        </h1>
        <p className="text-slate-400">Review and process student insurance claims</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, icon: ShieldCheck, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
          { label: "Paid Out", value: formatCurrency(stats.totalValue), icon: IndianRupee, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <Card key={label} className={`border ${border}`}>
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg ${bg} border ${border} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === f
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-white border border-transparent hover:border-white/10"
            }`}
          >
            {f} {f === "pending" && stats.pending > 0 ? `(${stats.pending})` : ""}
          </button>
        ))}
      </div>

      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No {filter === "all" ? "" : filter} claims</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-white/[0.02]">
                    <TableCell className="text-xs text-slate-400 font-mono">{claim.userId.slice(0, 8)}…</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{claim.description}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(claim.amount)}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{formatDate(claim.createdAt)}</TableCell>
                    <TableCell><Badge variant={badgeVariant(claim.status)}>{claim.status}</Badge></TableCell>
                    <TableCell>
                      {claim.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedClaim(claim); setApprovedAmount(String(claim.amount)); setReviewStatus("approved"); }}
                          className="gap-1 text-xs"
                        >
                          Review <ChevronDown className="w-3 h-3" />
                        </Button>
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
      <Dialog open={!!selectedClaim} onOpenChange={(o) => { if (!o) { setSelectedClaim(null); setReviewNote(""); setApprovedAmount(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Claim</DialogTitle>
            <DialogDescription>
              {selectedClaim?.description} — Claimed: {selectedClaim ? formatCurrency(selectedClaim.amount) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Decision */}
            <div className="flex gap-3">
              <button
                onClick={() => setReviewStatus("approved")}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  reviewStatus === "approved"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => setReviewStatus("rejected")}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  reviewStatus === "rejected"
                    ? "bg-red-500/20 border-red-500/40 text-red-300"
                    : "border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>

            {reviewStatus === "approved" && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Approved Amount (₹)</label>
                <Input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  placeholder={String(selectedClaim?.amount)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Review Note (sent to student)</label>
              <textarea
                className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                rows={3}
                placeholder={reviewStatus === "approved" ? "Approved as submitted." : "Claim does not meet coverage criteria…"}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedClaim(null)}>Cancel</Button>
            <Button
              onClick={handleReview}
              disabled={submitting}
              className={reviewStatus === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
            >
              {submitting ? "Submitting…" : `Confirm ${reviewStatus === "approved" ? "Approval" : "Rejection"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InsuranceAdminPage() {
  return <InsuranceAdminContent />;
}


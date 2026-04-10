"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClaims } from "@/hooks/useClaims";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/components/ToastProvider";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function InsurancePage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { claims, pending, approved, rejected, totalPending, totalApproved, loading, submit } = useClaims(userId);
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setFileName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!description.trim()) {
      toast({ title: "Description required", variant: "destructive" });
      return;
    }
    if (isNaN(num) || num <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive number.", variant: "destructive" });
      return;
    }
    if (!fileName.trim()) {
      toast({ title: "Bill Required", description: "You must attach a bill or receipt to submit a claim.", variant: "destructive" });
      return;
    }

    const result = await submit({
      userId,
      amount: num,
      description,
      fileUrl: fileName || undefined,
    });

    if (result.success) {
      toast({ title: "Claim submitted! 📋", description: "Your claim is now pending review.", variant: "success" });
      setOpen(false);
      resetForm();
    } else {
      toast({ title: "Submission failed", description: result.error, variant: "destructive" });
    }
  };

  const badgeVariant = (status: string) => {
    if (status === "approved") return "success" as const;
    if (status === "rejected") return "destructive" as const;
    return "warning" as const;
  };

  const stats = [
    { label: "Total Claims", value: claims.length, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Pending Review", value: pending.length, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: "Approved", value: approved.length, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Rejected", value: rejected.length, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Insurance Claims</h1>
          <p className="text-slate-400">Submit and track your campus health insurance claims</p>
        </div>
        <Button id="new-claim-btn" onClick={() => setOpen(true)} className="gap-2" size="lg">
          <Plus className="w-4 h-4" />
          New Claim
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <Card key={label} className={`border ${border}`}>
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Amount Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-amber-500/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Pending Amount</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalPending)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Approved Amount</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalApproved)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Claims</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {claims.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No claims filed yet</p>
              <Button variant="outline" onClick={() => setOpen(true)}>Submit your first claim</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-mono text-xs text-slate-400">{claim.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{claim.description}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(claim.amount)}</TableCell>
                    <TableCell className="text-slate-400">{formatDate(claim.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(claim.status)}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Submit Claim Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Insurance Claim</DialogTitle>
            <DialogDescription>Fill in the details below. All submitted claims start as "pending".</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="claim-description">Description *</Label>
              <Textarea
                id="claim-description"
                placeholder="e.g. Consultation fee for knee pain treatment at SAU health center…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="claim-amount">Amount (₹) *</Label>
              <Input
                id="claim-amount"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Upload Bill *</Label>
              <label
                htmlFor="claim-file"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-white/10 bg-slate-800/40 cursor-pointer hover:border-violet-500/40 transition-colors"
              >
                <Upload className="w-6 h-6 text-slate-500" />
                <span className="text-sm text-slate-400">
                  {fileName || "Click to upload a receipt or bill"}
                </span>
                <input
                  id="claim-file"
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast({ title: "File too large", description: "Max size is 5MB.", variant: "destructive" });
                        return;
                      }
                      setFileName(file.name);
                    }
                  }}
                />
              </label>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button id="submit-claim-btn" type="submit" disabled={loading}>
                {loading ? "Submitting…" : "Submit Claim"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

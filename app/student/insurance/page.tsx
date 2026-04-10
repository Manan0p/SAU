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
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useClaims } from "@/hooks/useClaims";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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

  const stats = [
    { label: "Total Claims", value: claims.length, icon: FileText, color: "#00478d", bg: "#d6e3ff" },
    { label: "Pending Review", value: pending.length, icon: Clock, color: "#793100", bg: "#ffdbcb" },
    { label: "Approved", value: approved.length, icon: CheckCircle, color: "#005eb8", bg: "#cae2fe" },
    { label: "Rejected", value: rejected.length, icon: XCircle, color: "#ba1a1a", bg: "#ffdad6" },
  ];

  return (
    <div className="p-10 max-w-6xl mx-auto pb-32" style={{ background: "#f7f9fb", minHeight: "100vh" }}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#cae2fe" }}>
            <Shield className="w-6 h-6 text-[#4a6078]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#191C1E] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Insurance Claims</h1>
            <p className="text-sm font-medium" style={{ color: "#727783", fontFamily: "var(--font-public-sans)" }}>Submit and track your campus health insurance claims</p>
          </div>
        </div>
        <button 
          onClick={() => setOpen(true)} 
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-[0_4px_16px_rgba(0,94,184,0.15)] hover:scale-105"
          style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
        >
          <Plus className="w-4 h-4" />
          File New Claim
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div 
            key={label}
            className="bg-white rounded-3xl p-6 relative overflow-hidden group shadow-[0_2px_12px_rgba(25,28,30,0.04)] transition-transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
               <Icon className="w-24 h-24" style={{ color }} />
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 relative z-10" style={{ background: bg }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <p className="text-3xl font-bold text-[#191c1e] relative z-10" style={{ fontFamily: 'var(--font-manrope)' }}>{value}</p>
            <p className="text-xs font-semibold text-[#727783] mt-1 relative z-10 uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>

      {/* Amount Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <div className="bg-white rounded-3xl p-6 flex items-center gap-5 shadow-[0_2px_12px_rgba(25,28,30,0.04)]">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#ffdbcb" }}>
            <TrendingUp className="w-6 h-6 text-[#793100]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#727783] mb-1">Total Pending Amount</p>
            <p className="text-2xl font-bold text-[#191C1E]" style={{ fontFamily: 'var(--font-manrope)' }}>{formatCurrency(totalPending)}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 flex items-center gap-5 shadow-[0_2px_12px_rgba(25,28,30,0.04)]">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#d6e3ff" }}>
            <IndianRupee className="w-6 h-6 text-[#00478d]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#727783] mb-1">Total Approved Amount</p>
            <p className="text-2xl font-bold text-[#191C1E]" style={{ fontFamily: 'var(--font-manrope)' }}>{formatCurrency(totalApproved)}</p>
          </div>
        </div>
      </div>

      {/* Claims List (Replacing standard table with SaaS-style dense cards) */}
      <div className="bg-white rounded-3xl p-2 shadow-[0_2px_12px_rgba(25,28,30,0.04)]">
        <div className="px-6 py-5 border-b border-[#f2f4f6]">
          <h2 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>Claim History</h2>
        </div>
        
        {claims.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-[#f7f9fb] rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#c2c6d4]" />
            </div>
            <p className="text-base font-semibold text-[#424752] mb-2">No claims filed yet</p>
            <p className="text-sm text-[#727783] max-w-sm mb-6">You haven't submitted any insurance claims. Need to submit a medical bill?</p>
            <button 
              onClick={() => setOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#eceef0] text-[#191c1e] text-sm font-semibold hover:bg-[#e0e3e5] transition-colors"
            >
              Submit your first claim
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#727783] bg-[#ffffff] border-b border-[#f2f4f6]">
              <div className="col-span-2">Date</div>
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-3 pl-8">Status</div>
            </div>
            
            {claims.map((claim, idx) => (
              <div 
                key={claim.id} 
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors group hover:bg-[#f7f9fb]"
                style={{ borderBottom: idx !== claims.length - 1 ? "1px solid #f2f4f6" : "none" }}
              >
                <div className="col-span-2 text-sm text-[#424752]">{formatDate(claim.createdAt)}</div>
                <div className="col-span-5 text-sm font-semibold text-[#191c1e] truncate pr-4">{claim.description}</div>
                <div className="col-span-2 text-right text-sm font-bold text-[#191c1e] font-mono">{formatCurrency(claim.amount)}</div>
                <div className="col-span-3 pl-8 flex items-center">
                  <span
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      background:
                        claim.status === "approved"
                          ? "#d6e3ff"
                          : claim.status === "rejected"
                          ? "#ffdad6"
                          : "#ffdbcb",
                      color:
                        claim.status === "approved"
                          ? "#00478d"
                          : claim.status === "rejected"
                          ? "#ba1a1a"
                          : "#793100",
                    }}
                  >
                    {claim.status === "approved" && <CheckCircle className="w-3.5 h-3.5" />}
                    {claim.status === "rejected" && <XCircle className="w-3.5 h-3.5" />}
                    {claim.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                    {claim.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Claim Dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 border-none bg-white shadow-[0_24px_60px_rgba(25,28,30,0.15)]">
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#d6e3ff] flex items-center justify-center mb-4">
               <Shield className="w-6 h-6 text-[#00478d]" />
            </div>
            <DialogTitle className="text-2xl font-bold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>New Insurance Claim</DialogTitle>
            <DialogDescription className="text-sm text-[#727783] mt-2">
              Please provide accurate details from your original medical bill.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="claim-description" className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Description</label>
              <textarea
                id="claim-description"
                placeholder="e.g. SAU Health Center - General Consultation"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-[#f7f9fb] border-none rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:ring-2 focus:ring-[#d6e3ff] transition-all resize-none h-24"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="claim-amount" className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Amount (₹)</label>
              <input
                id="claim-amount"
                type="number"
                min="1"
                step="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-[#f7f9fb] border-none rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:ring-2 focus:ring-[#d6e3ff] transition-all font-mono font-bold"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Bill Attachment</label>
              <label
                htmlFor="claim-file"
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-[#e0e3e5] bg-[#f7f9fb] cursor-pointer hover:border-[#a9c7ff] hover:bg-[#f2f4f6] transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-[#005eb8]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#191c1e] mb-1">
                    {fileName || "Click to browse files"}
                  </p>
                  <p className="text-[11px] text-[#727783]">JPG, PNG or PDF (Max 5MB)</p>
                </div>
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

            <DialogFooter className="gap-3 pt-6 flex-row w-full justify-end">
              <button 
                type="button" 
                onClick={() => { setOpen(false); resetForm(); }}
                className="px-5 py-3 rounded-xl text-sm font-semibold bg-[#eceef0] text-[#424752] hover:bg-[#e0e3e5] transition-colors"
              >
                Cancel
              </button>
              <button 
                id="submit-claim-btn" 
                type="submit" 
                disabled={loading}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-[0_4px_16px_rgba(0,94,184,0.15)] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
              >
                {loading ? "Submitting…" : "Submit Claim"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

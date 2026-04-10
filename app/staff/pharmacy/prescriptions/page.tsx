"use client";

import { useEffect, useState, useCallback } from "react";
import { Pill, CheckCircle, RefreshCw } from "lucide-react";
import { getInventory, getAllPrescriptions, updatePrescriptionStatus, updateInventoryQuantity } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ToastProvider";
import { formatDate } from "@/lib/utils";
import type { InventoryItem, Prescription } from "@/types";

export default function StaffPharmacyPage() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispenseLoading, setDispenseLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [inv, presc] = await Promise.all([getInventory(), getAllPrescriptions()]);
    setInventory(inv);
    setPrescriptions(presc);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDispense = async (prescription: Prescription) => {
    setDispenseLoading(prescription.id);
    const result = await updatePrescriptionStatus(prescription.id, "dispensed");
    if (result.success) {
      for (const med of prescription.medicines) {
        const item = inventory.find((i) => i.name.toLowerCase() === med.name.toLowerCase());
        if (item) await updateInventoryQuantity(item.id, -med.qty);
      }
      toast({ title: "Prescription dispensed ✓", variant: "success" });
      load();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setDispenseLoading(null);
  };
  const pendingPrescriptions = prescriptions.filter((p) => p.status === "pending");

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#ecfdf5] text-[#059669] border border-[#d1fae5] shadow-sm">
            <Pill className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: "var(--font-manrope)" }}>
              Prescriptions
            </h1>
            <p className="text-[#727783] font-medium mt-1">View and dispense student prescriptions</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          className="gap-2 bg-white border-[#eceef0] hover:bg-[#f2f4f6]"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            label: "Pending Prescriptions",
            value: pendingPrescriptions.length,
            color: "text-[#d97706]",
            border: "border-[#fef3c7]",
            bg: "bg-[#fffbeb]",
          },
          {
            label: "Total Prescriptions",
            value: prescriptions.length,
            color: "text-[#16a34a]",
            border: "border-[#dcfce7]",
            bg: "bg-[#f0fdf4]",
          },
        ].map(({ label, value, color, border, bg }) => (
          <Card key={label} className={`border ${border} bg-white rounded-3xl shadow-[0_2px_12px_rgba(25,28,30,0.04)]`}>
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} border ${border} mb-4`} />
              <p className={`text-3xl font-bold ${color} mb-1`} style={{ fontFamily: "var(--font-manrope)" }}>{value}</p>
              <p className="text-xs text-[#727783] font-bold uppercase tracking-widest">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-[#059669] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#727783] text-sm font-medium">Loading prescriptions...</p>
        </div>
      ) : (
        <Card className="bg-white rounded-3xl border border-[#eceef0] shadow-[0_2px_12px_rgba(25,28,30,0.04)] overflow-hidden">
          <div className="px-8 py-5 border-b border-[#eceef0] bg-[#fcfdfe]">
            <h3 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>Prescription Queue</h3>
          </div>
          <CardContent className="p-0">
            {prescriptions.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[#f7f9fb] flex items-center justify-center mb-4 border border-[#eceef0]">
                  <CheckCircle className="w-8 h-8 text-[#c2c6d4]" />
                </div>
                <p className="text-[#191c1e] font-bold">No prescriptions found</p>
                <p className="text-[#727783] text-sm mt-1">New prescriptions will appear here when doctors issue them</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#eceef0] hover:bg-transparent">
                      <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px]">Patient</TableHead>
                      <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px]">Doctor</TableHead>
                      <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px]">Medicines</TableHead>
                      <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px]">Date</TableHead>
                      <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px]">Status</TableHead>
                      <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions.map((p) => (
                      <TableRow key={p.id} className="border-[#eceef0] hover:bg-[#fcfdfe] transition-colors">
                        <TableCell className="font-semibold text-sm text-[#191c1e]">{p.patientName}</TableCell>
                        <TableCell className="text-xs text-[#727783] font-medium">{p.doctorName}</TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {p.medicines.map((m, i) => (
                              <p key={i} className="text-xs text-[#727783]">{m.name} · {m.dosage} · {m.duration}</p>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-[#727783] font-medium">{formatDate(p.created_at)}</TableCell>
                        <TableCell>
                          <Badge className={
                            p.status === "dispensed"
                              ? "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7] text-[10px] uppercase tracking-wider font-bold"
                              : "bg-[#fffbeb] text-[#d97706] border-[#fef3c7] text-[10px] uppercase tracking-wider font-bold"
                          }>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.status === "pending" ? (
                            <Button
                              size="sm"
                              onClick={() => handleDispense(p)}
                              disabled={dispenseLoading === p.id}
                              className="text-xs font-bold bg-[#16a34a] hover:bg-[#15803d] rounded-xl h-8 px-4"
                            >
                              {dispenseLoading === p.id ? "..." : "Dispense"}
                            </Button>
                          ) : (
                            <span className="text-xs text-[#c2c6d4] font-bold">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

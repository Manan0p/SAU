"use client";

import { useEffect, useState, useCallback } from "react";
import { Pill, CheckCircle, RefreshCw, FileSearch, Stethoscope } from "lucide-react";
import { getInventory, getAllPrescriptions, updatePrescriptionStatus, updateInventoryQuantity } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ToastProvider";
import { formatDate, cn } from "@/lib/utils";
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
              Prescription Registry
            </h1>
            <p className="text-[#727783] font-semibold mt-1">
               Systemized Medication Dispensing · <span className="text-[#059669] font-bold">Encrypted Queue</span>
            </p>
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
            icon: FileSearch
          },
          {
            label: "Total Prescriptions",
            value: prescriptions.length,
            color: "text-[#16a34a]",
            border: "border-[#dcfce7]",
            bg: "bg-[#f0fdf4]",
            icon: CheckCircle
          },
        ].map(({ label, value, color, border, bg, icon: Icon }) => (
          <Card key={label} className={`border border-[#eceef0] bg-white rounded-[2rem] shadow-[0_4px_20px_rgba(25,28,30,0.04)] group hover:shadow-xl transition-all duration-300`}>
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-xl scale-75 md:scale-100 flex items-center justify-center transition-transform group-hover:scale-110 mb-5 border ${bg} ${border}`}>
                 <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <p className="text-[#727783] text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
              <p className={`text-4xl font-black text-[#191c1e]`} style={{ fontFamily: "var(--font-manrope)" }}>{loading ? "—" : value}</p>
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
        <Card className="bg-white rounded-[2.5rem] border border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.06)] overflow-hidden">
          <div className="px-10 py-8 border-b border-[#eceef0] flex items-center justify-between bg-[#fcfdfe]">
            <div className="flex items-center gap-3">
               <Pill className="w-5 h-5 text-[#059669]" />
               <h3 className="text-lg font-extrabold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>
                  Medication Queue <span className="text-[#c2c6d4] font-bold ml-2">({prescriptions.length})</span>
               </h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#059669] flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
               Live Inventory Sync
            </span>
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
                      <TableRow key={p.id} className="border-[#eceef0] hover:bg-[#f7f9fb] transition-all group border-l-[3px] border-l-transparent hover:border-l-[#059669]">
                        <TableCell className="px-10 py-6">
                           <p className="font-black text-[#191c1e] text-base group-hover:text-[#059669] transition-colors" style={{ fontFamily: "var(--font-manrope)" }}>{p.patientName}</p>
                           <p className="text-[10px] text-[#727783] font-medium uppercase tracking-wider mt-1.5 flex items-center gap-2">
                              <Stethoscope className="w-3 h-3 opacity-40" /> Dr. {p.doctorName.replace("Dr. ", "")}
                           </p>
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="space-y-1.5">
                            {p.medicines.map((m, i) => (
                              <div key={i} className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-[#059669]/60 shrink-0" />
                                 <p className="text-sm font-bold text-[#4a6078]">{m.name}</p>
                                 <span className="text-[10px] font-black uppercase tracking-widest bg-[#f2f4f6] px-2 py-0.5 rounded-md border border-[#eceef0] text-[#727783] ml-1">{m.dosage}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-[#c2c6d4] uppercase tracking-widest mb-1">Prescribed</span>
                              <span className="text-xs font-bold text-[#727783]">{formatDate(p.created_at)}</span>
                           </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <Badge className={cn(
                            "px-4 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] shadow-sm transition-all group-hover:bg-white",
                            p.status === "dispensed"
                              ? "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]"
                              : "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]"
                          )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full mr-2", p.status === 'dispensed' ? "bg-green-500" : "bg-orange-500")} />
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-10 py-6 text-right">
                          {p.status === "pending" ? (
                            <Button
                              size="sm"
                              onClick={() => handleDispense(p)}
                              disabled={dispenseLoading === p.id}
                              className="text-[10px] font-black uppercase tracking-widest bg-[#059669] hover:bg-[#047857] text-white rounded-xl h-10 px-6 shadow-[0_4px_12px_rgba(5,150,105,0.2)] hover:shadow-[0_8px_20px_rgba(5,150,105,0.3)] transition-all"
                            >
                              {dispenseLoading === p.id ? "Processing..." : "Dispense"}
                            </Button>
                          ) : (
                            <div className="flex items-center justify-end gap-2 text-[#c2c6d4]">
                               <CheckCircle className="w-4 h-4" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Handed Over</span>
                            </div>
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

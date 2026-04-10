"use client";

import { useEffect, useState, useCallback } from "react";
import { Pill, Package, AlertTriangle, CheckCircle, RefreshCw, ShoppingCart, XCircle } from "lucide-react";
import { getInventory, getAllPrescriptions, updatePrescriptionStatus, updateInventoryQuantity } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ToastProvider";
import { formatDate } from "@/lib/utils";
import type { InventoryItem, Prescription } from "@/types";

interface PharmacyOrder {
  id: string;
  studentId: string;
  item_name: string;
  quantity_requested: number;
  status: "pending" | "fulfilled" | "rejected";
  notes?: string;
  created_at: string;
}

export default function StaffPharmacyPage() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispenseLoading, setDispenseLoading] = useState<string | null>(null);
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);

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



  const lowStockItems = inventory.filter((i) => i.quantity <= i.threshold);
  const pendingPrescriptions = prescriptions.filter((p) => p.status === "pending");

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Pill className="w-8 h-8 text-emerald-400" />
            Prescriptions
          </h1>
          <p className="text-slate-400">View and dispense student prescriptions</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Pending Prescriptions", value: pendingPrescriptions.length, color: "text-amber-400", border: "border-amber-500/20" },
          { label: "Total Prescriptions", value: prescriptions.length, color: "text-emerald-400", border: "border-emerald-500/20" },
        ].map(({ label, value, color, border }) => (
          <Card key={label} className={`border ${border}`}>
            <CardContent className="p-5">
              <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {prescriptions.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No prescriptions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Medicines</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.patientName}</TableCell>
                      <TableCell className="text-xs text-slate-400">{p.doctorName}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {p.medicines.map((m, i) => (
                            <p key={i} className="text-xs text-slate-300">{m.name} · {m.dosage} · {m.duration}</p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{formatDate(p.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "dispensed" ? "success" : "warning"}>{p.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {p.status === "pending" && (
                          <Button size="sm" onClick={() => handleDispense(p)} disabled={dispenseLoading === p.id} className="text-xs bg-emerald-600 hover:bg-emerald-700">
                            {dispenseLoading === p.id ? "…" : "Dispense"}
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
      )}
    </div>
  );
}

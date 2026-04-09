"use client";

import { useEffect, useState, useCallback } from "react";
import { Pill, Package, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getInventory, getAllPrescriptions, updatePrescriptionStatus, updateInventoryQuantity } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ToastProvider";
import { formatDate } from "@/lib/utils";
import type { InventoryItem, Prescription } from "@/types";

function PharmacyContent() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"prescriptions" | "inventory">("prescriptions");
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
      // Deduct inventory for each medicine
      for (const med of prescription.medicines) {
        const item = inventory.find((i) => i.name.toLowerCase() === med.name.toLowerCase());
        if (item) {
          await updateInventoryQuantity(item.id, -med.qty);
        }
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
            Pharmacy
          </h1>
          <p className="text-slate-400">Manage prescriptions and inventory</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Pending Prescriptions", value: pendingPrescriptions.length, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "Dispensed Today", value: prescriptions.filter((p) => p.status === "dispensed" && formatDate(p.created_at) === formatDate(new Date().toISOString())).length, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Low Stock Items", value: lowStockItems.length, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
          { label: "Total Medicines", value: inventory.length, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
        ].map(({ label, value, color, bg, border }) => (
          <Card key={label} className={`border ${border}`}>
            <CardContent className="p-5">
              <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="font-semibold text-red-300">Low Stock Alert</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <span key={item.id} className="text-xs bg-red-500/10 border border-red-500/20 text-red-300 px-2 py-1 rounded-lg">
                  {item.name}: {item.quantity} {item.unit} left
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(["prescriptions", "inventory"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-white border border-transparent hover:border-white/10"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : tab === "prescriptions" ? (
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
                            <p key={i} className="text-xs text-slate-300">
                              {m.name} · {m.dosage} · {m.duration}
                            </p>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{formatDate(p.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "dispensed" ? "success" : "warning"}>{p.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {p.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleDispense(p)}
                            disabled={dispenseLoading === p.id}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700"
                          >
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
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Price / Unit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium text-sm text-white">{item.name}</p>
                      {item.generic_name && <p className="text-xs text-slate-500">{item.generic_name}</p>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{item.category ?? "—"}</TableCell>
                    <TableCell className={`font-bold ${item.quantity <= item.threshold ? "text-red-400" : "text-white"}`}>
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{item.unit}</TableCell>
                    <TableCell className="text-xs text-slate-300">₹{item.price_per_unit}</TableCell>
                    <TableCell>
                      {item.quantity <= item.threshold ? (
                        <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                      ) : (
                        <Badge variant="success" className="text-xs">In Stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PharmacyPage() {
  return <PharmacyContent />;
}


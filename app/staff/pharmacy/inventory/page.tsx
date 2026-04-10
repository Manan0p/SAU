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
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"inventory" | "orders">("inventory");
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const inv = await getInventory();
    setInventory(inv);
    const { data: ordersData } = await supabase
      .from("pharmacy_orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders((ordersData ?? []) as PharmacyOrder[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);



  const handleOrderAction = async (orderId: string, newStatus: "fulfilled" | "rejected") => {
    setOrderActionLoading(orderId);
    const { error } = await supabase.from("pharmacy_orders").update({ status: newStatus }).eq("id", orderId);
    setOrderActionLoading(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus === "fulfilled" ? "Order fulfilled ✓" : "Order rejected", variant: newStatus === "fulfilled" ? "success" : "default" });
      load();
    }
  };

  const lowStockItems = inventory.filter((i) => i.quantity <= i.threshold);

  const pendingOrders = orders.filter((o) => o.status === "pending");

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Package className="w-8 h-8 text-emerald-400" />
            Inventory & Orders
          </h1>
          <p className="text-slate-400">Manage stock and student requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Pending Student Orders", value: pendingOrders.length, color: "text-violet-400", border: "border-violet-500/20" },
          { label: "Low Stock Items", value: lowStockItems.length, color: "text-red-400", border: "border-red-500/20" },
          { label: "Total Medicines", value: inventory.length, color: "text-emerald-400", border: "border-emerald-500/20" },
        ].map(({ label, value, color, border }) => (
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
                  {item.name}: {item.quantity} {item.unit}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(["inventory", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-white border border-transparent hover:border-white/10"
            }`}
          >
            {t === "orders" ? `Student Orders${pendingOrders.length > 0 ? ` (${pendingOrders.length})` : ""}` : "Inventory"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>

      ) : tab === "orders" ? (
        <Card>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No student orders yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs text-slate-500">{order.studentId.slice(0, 8)}…</TableCell>
                      <TableCell className="font-medium text-sm text-white">{order.item_name}</TableCell>
                      <TableCell className="text-sm text-slate-300">{order.quantity_requested}</TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-[120px] truncate">{order.notes ?? "—"}</TableCell>
                      <TableCell className="text-xs text-slate-400">{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === "fulfilled" ? "success" :
                          order.status === "rejected" ? "destructive" : "warning"
                        }>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 gap-1"
                              onClick={() => handleOrderAction(order.id, "fulfilled")}
                              disabled={orderActionLoading === order.id}
                            >
                              <CheckCircle className="w-3 h-3" /> Fulfill
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 gap-1"
                              onClick={() => handleOrderAction(order.id, "rejected")}
                              disabled={orderActionLoading === order.id}
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </Button>
                          </div>
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

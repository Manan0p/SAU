"use client";

import { useEffect, useState, useCallback } from "react";
import { Pill, Search, ShoppingCart, CheckCircle, AlertTriangle, Package, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getInventory } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatCurrency } from "@/lib/utils";
import type { InventoryItem } from "@/types";

interface PharmacyOrder {
  id: string;
  item_name: string;
  quantity_requested: number;
  status: "pending" | "fulfilled" | "rejected";
  notes?: string;
  created_at: string;
}

export default function StudentPharmacyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [myOrders, setMyOrders] = useState<PharmacyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"browse" | "orders">("browse");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const inv = await getInventory();
    setInventory(inv);
    if (user?.id) {
      const { data } = await supabase
        .from("pharmacy_orders")
        .select("*")
        .eq("studentId", user.id)
        .order("created_at", { ascending: false });
      setMyOrders((data ?? []) as PharmacyOrder[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.generic_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (item.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleOrder = async () => {
    if (!selectedItem || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("pharmacy_orders").insert([{
      studentId: user.id,
      itemId: selectedItem.id,
      item_name: selectedItem.name,
      quantity_requested: orderQty,
      notes: orderNotes || null,
      status: "pending",
    }]);
    setSubmitting(false);
    if (error) {
      toast({ title: "Order failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Order placed! 🎉", description: `Your request for ${selectedItem.name} has been submitted.`, variant: "success" });
      setSelectedItem(null);
      setOrderQty(1);
      setOrderNotes("");
      load();
    }
  };

  const statusColors = {
    pending: "warning",
    fulfilled: "success",
    rejected: "destructive",
  } as const;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Pill className="w-8 h-8 text-violet-400" />
          Campus Pharmacy
        </h1>
        <p className="text-slate-400">Browse available medicines and request orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["browse", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-white border border-transparent hover:border-white/10"
            }`}
          >
            {t === "browse" ? "Browse Medicines" : `My Orders${myOrders.length > 0 ? ` (${myOrders.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "browse" ? (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search medicines, generics, categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredInventory.map((item) => {
                const inStock = item.quantity > item.threshold;
                return (
                  <Card key={item.id} className={`border transition-all hover:border-violet-500/30 ${!inStock ? "opacity-60" : ""}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                          <Pill className="w-5 h-5 text-violet-400" />
                        </div>
                        <Badge variant={inStock ? "success" : "destructive"} className="text-xs">
                          {inStock ? "In Stock" : "Low Stock"}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-white text-sm mb-1">{item.name}</h3>
                      {item.generic_name && <p className="text-xs text-slate-500 mb-1">{item.generic_name}</p>}
                      <div className="flex items-center gap-2 mb-3">
                        {item.category && (
                          <span className="text-xs bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">{item.quantity} {item.unit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-violet-400">{formatCurrency(item.price_per_unit)}/{item.unit}</p>
                        <Button
                          size="sm"
                          className="gap-1 text-xs"
                          disabled={!inStock}
                          onClick={() => { setSelectedItem(item); setOrderQty(1); setOrderNotes(""); }}
                        >
                          <ShoppingCart className="w-3 h-3" />
                          Request
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredInventory.length === 0 && (
                <div className="col-span-3 py-16 text-center">
                  <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No medicines found matching "{search}"</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* My Orders Tab */
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : myOrders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No orders yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setTab("browse")}>
                  Browse Medicines
                </Button>
              </CardContent>
            </Card>
          ) : (
            myOrders.map((order) => (
              <Card key={order.id} className={`border ${
                order.status === "fulfilled" ? "border-emerald-500/20" :
                order.status === "rejected" ? "border-red-500/20" : "border-amber-500/20"
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <Pill className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{order.item_name}</p>
                        <p className="text-xs text-slate-500">Qty: {order.quantity_requested} · {new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                        {order.notes && <p className="text-xs text-slate-600 italic">"{order.notes}"</p>}
                      </div>
                    </div>
                    <Badge variant={statusColors[order.status]}>{order.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Order Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(o) => { if (!o) setSelectedItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Medicine</DialogTitle>
            <DialogDescription>Submit a request to the pharmacy for this medicine.</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="font-semibold text-white">{selectedItem.name}</p>
                {selectedItem.generic_name && <p className="text-xs text-slate-500">{selectedItem.generic_name}</p>}
                <p className="text-sm text-violet-400 mt-1">{formatCurrency(selectedItem.price_per_unit)} / {selectedItem.unit}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Quantity ({selectedItem.unit})</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white hover:bg-white/5"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-lg w-8 text-center">{orderQty}</span>
                  <button
                    onClick={() => setOrderQty(Math.min(selectedItem.quantity, orderQty + 1))}
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white hover:bg-white/5"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Notes (optional)</label>
                <textarea
                  className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={2}
                  placeholder="e.g. Doctor prescribed, refill request…"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>
              {!selectedItem || selectedItem.quantity <= selectedItem.threshold ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-300">Low stock — availability may be limited</p>
                </div>
              ) : null}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedItem(null)}>Cancel</Button>
            <Button onClick={handleOrder} disabled={submitting} className="gap-2">
              {submitting ? "Placing…" : <><ShoppingCart className="w-4 h-4" /> Place Order</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

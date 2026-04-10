"use client";

import { useEffect, useState, useCallback } from "react";
import { Pill, Package, AlertTriangle, CheckCircle, RefreshCw, ShoppingCart, XCircle, Search, Filter, ArrowRight, History, Box } from "lucide-react";
import { getInventory, getAllPrescriptions, updatePrescriptionStatus, updateInventoryQuantity } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ToastProvider";
import { formatDate, cn } from "@/lib/utils";
import type { InventoryItem, Prescription } from "@/types";

interface PharmacyOrder {
  id: string;
  studentId: string;
  item_name: string;
  quantity_requested: number;
  status: "pending" | "fulfilled" | "rejected";
  notes?: string;
  created_at: string;
  student_name?: string;
}

export default function StaffPharmacyPage() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"inventory" | "orders">("inventory");
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const inv = await getInventory();
      setInventory(inv);
      
      const { data: ordersData } = await supabase
        .from("pharmacy_orders")
        .select("*, profiles(name)")
        .order("created_at", { ascending: false });
        
      setOrders(
        (ordersData ?? []).map((o: any) => ({
          ...o,
          student_name: o.profiles?.name,
        }))
      );
    } catch (e) {
      console.error("Pharmacy load fail:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOrderAction = async (orderId: string, newStatus: "fulfilled" | "rejected") => {
    setOrderActionLoading(orderId);
    const { error } = await supabase.from("pharmacy_orders").update({ status: newStatus }).eq("id", orderId);
    setOrderActionLoading(null);
    if (error) {
      toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: newStatus === "fulfilled" ? "Inventory Dispatched ✓" : "Order Rescinded", 
        variant: newStatus === "fulfilled" ? "success" : "default" 
      });
      load();
    }
  };

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.category?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = inventory.filter((i) => i.quantity <= i.threshold);
  const pendingOrders = orders.filter((o) => o.status === "pending");

  return (
    <div className="min-h-screen pb-20 p-10 max-w-7xl mx-auto space-y-10" style={{ background: "#f7f9fb" }}>
      {/* Header Area */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#059669] text-white shadow-xl shadow-[#059669]/20 transition-transform hover:scale-105 duration-300">
              <Pill className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Pharmacy Operations</h1>
              <p className="text-[#727783] font-semibold mt-1 flex items-center gap-2">
                 Inventory Control · <span className="text-[#059669] font-bold">Clinical Logistics</span>
              </p>
           </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl border border-[#eceef0] bg-white text-[#424752] hover:text-[#059669] hover:bg-[#f7f9fb] text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> 
          Verify Stock Sync
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Orders", value: pendingOrders.length, color: "#d97706", bg: "#fffbeb", border: "#fef3c7" },
          { label: "Critical Stock", value: lowStockItems.length, color: "#dc2626", bg: "#fef2f2", border: "#fee2e2" },
          { label: "Registry Count", value: inventory.length, color: "#059669", bg: "#ecfdf5", border: "#d1fae5" },
          { label: "Processed Monthly", value: 142, color: "#2563eb", bg: "#eff6ff", border: "#dbeafe" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className="bg-white rounded-[2rem] p-6 border border-[#eceef0] shadow-[0_4px_20px_rgba(25,28,30,0.04)] group hover:shadow-xl transition-all duration-300">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 border transition-transform group-hover:scale-110" style={{ background: bg, borderColor: border }}>
               <Box className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-[#727783] text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-3xl font-black text-[#191c1e] leading-none" style={{ fontFamily: 'var(--font-manrope)' }}>{loading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Critical Alerts */}
      {lowStockItems.length > 0 && (
        <div className="p-6 rounded-[2rem] bg-[#fef2f2] border border-[#fee2e2] flex items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-[#fee2e2]">
              <AlertTriangle className="w-6 h-6 text-[#dc2626] animate-pulse" />
           </div>
           <div className="flex-1">
              <p className="text-[#dc2626] font-black uppercase text-[10px] tracking-widest mb-1">Stock Depletion Alert</p>
              <div className="flex flex-wrap gap-2">
                 {lowStockItems.slice(0, 5).map(item => (
                    <Badge key={item.id} className="bg-white text-[#dc2626] border border-[#fee2e2] font-bold text-[10px] px-3 py-1">
                       {item.name}: {item.quantity} {item.unit} Remaining
                    </Badge>
                 ))}
                 {lowStockItems.length > 5 && <span className="text-[#b91c1c] text-xs font-black flex items-center ml-2">+ {lowStockItems.length - 5} more</span>}
              </div>
           </div>
           <Button variant="outline" size="sm" className="rounded-xl border-[#dc2626]/20 text-[#dc2626] font-black text-[10px] uppercase h-10 px-6 hover:bg-[#dc2626] hover:text-white transition-all">Procure Restock</Button>
        </div>
      )}

      {/* Controls & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-2 p-1.5 bg-white border border-[#eceef0] rounded-2xl shadow-sm">
          {(["inventory", "orders"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                 "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                 tab === t 
                  ? "bg-[#059669] text-white shadow-lg shadow-[#059669]/20" 
                  : "text-[#727783] hover:text-[#191c1e] hover:bg-[#f7f9fb]"
              )}
            >
              {t === "orders" ? `Dispatch Queue (${pendingOrders.length})` : "Global Inventory"}
            </button>
          ))}
        </div>
        
        <div className="relative group max-w-sm w-full">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c2c6d4] group-focus-within:text-[#059669] transition-colors" />
           <input 
              type="text"
              placeholder="Filter reagents or pharmaceuticals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 h-12 rounded-2xl bg-white border-[#eceef0] focus:ring-[#059669]/10 focus:border-[#059669] font-bold text-sm text-[#191c1e] shadow-sm transition-all focus:outline-none placeholder:text-[#c2c6d4] placeholder:font-medium"
           />
        </div>
      </div>

      {/* Main Table Content */}
      <Card className="rounded-[2.5rem] border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.06)] overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-32 gap-5">
               <div className="w-12 h-12 border-4 border-[#059669] border-t-transparent rounded-full animate-spin" />
               <p className="text-[#727783] text-[10px] font-black uppercase tracking-[0.3em]">Accessing Pharmacy Core...</p>
             </div>
          ) : tab === "orders" ? (
             <Table>
                <TableHeader className="bg-[#fcfdfe]">
                   <TableRow className="hover:bg-transparent border-[#eceef0]">
                      <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Requesting Unit</TableHead>
                      <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Clinical Order</TableHead>
                      <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Volume</TableHead>
                      <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Notes</TableHead>
                      <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Status</TableHead>
                      <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783] text-right">Action Packet</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {orders.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="py-24 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#f7f9fb] flex items-center justify-center mx-auto mb-4 border border-[#eceef0]">
                           <ShoppingCart className="w-6 h-6 text-[#c2c6d4]" />
                        </div>
                        <p className="text-xl font-black text-[#191c1e] tracking-tight">Queue Depleted</p>
                        <p className="text-[#727783] text-xs mt-1 font-bold">No student orders currently localized in buffer</p>
                      </TableCell></TableRow>
                   ) : orders.map(order => (
                      <TableRow key={order.id} className="group hover:bg-[#f7f9fb] transition-all border-[#eceef0]">
                         <TableCell className="px-10 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-[#f2f4f6] flex items-center justify-center text-[#059669] font-black text-sm border border-[#eceef0] group-hover:bg-white shadow-sm transition-all">
                                  {order.student_name?.[0]?.toUpperCase() ?? "U"}
                               </div>
                               <div>
                                  <p className="font-black text-[#191c1e] text-sm group-hover:text-[#059669] transition-colors">{order.student_name ?? "Incognito"}</p>
                                  <p className="text-[10px] font-bold text-[#c2c6d4] mt-0.5 font-mono">{order.studentId.slice(0, 8)}...</p>
                               </div>
                            </div>
                         </TableCell>
                         <TableCell className="px-6 py-6">
                            <p className="font-extrabold text-[#191c1e] text-sm">{order.item_name}</p>
                            <p className="text-[10px] font-bold text-[#727783] mt-0.5 uppercase tracking-widest">Medical Order</p>
                         </TableCell>
                         <TableCell className="px-6 py-6">
                            <Badge variant="outline" className="bg-[#ecfdf5] text-[#059669] border-[#d1fae5] font-black text-[10px] px-2.5 py-0.5">
                               {order.quantity_requested} UNIT{order.quantity_requested !== 1 ? 'S' : ''}
                            </Badge>
                         </TableCell>
                         <TableCell className="px-6 py-6 max-w-[150px]">
                            <p className="text-[11px] font-medium text-[#727783] italic truncate">"{order.notes || "—"}"</p>
                         </TableCell>
                         <TableCell className="px-6 py-6">
                            <Badge className={cn(
                               "font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-lg border",
                               order.status === "fulfilled" ? "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]" :
                               order.status === "rejected" ? "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]" : "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]"
                            )}>
                               {order.status}
                            </Badge>
                         </TableCell>
                         <TableCell className="px-10 py-6 text-right">
                            {order.status === "pending" && (
                               <div className="flex gap-2 justify-end">
                                  <Button size="sm" className="bg-[#16a34a] hover:bg-[#15803d] text-white font-black text-[10px] uppercase h-9 rounded-xl shadow-lg shadow-[#16a34a]/10"
                                     onClick={() => handleOrderAction(order.id, "fulfilled")}
                                     disabled={orderActionLoading === order.id}
                                  >
                                     <CheckCircle className="w-3.5 h-3.5 mr-1" /> Fulfill
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-[#dc2626] border-[#fee2e2] bg-white hover:bg-[#fef2f2] font-black text-[10px] uppercase h-9 rounded-xl"
                                     onClick={() => handleOrderAction(order.id, "rejected")}
                                     disabled={orderActionLoading === order.id}
                                  >
                                     Reject
                                  </Button>
                               </div>
                            )}
                         </TableCell>
                      </TableRow>
                   ))}
                </TableBody>
             </Table>
          ) : (
             <Table>
                <TableHeader className="bg-[#fcfdfe]">
                   <TableRow className="hover:bg-transparent border-[#eceef0]">
                      <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Medical Registry</TableHead>
                      <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Classification</TableHead>
                      <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Inventory Level</TableHead>
                      <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Unit Metric</TableHead>
                      <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783]">Economic Valuation</TableHead>
                      <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-[#727783] text-right">Integrity Status</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {filteredInventory.map(item => (
                      <TableRow key={item.id} className="group hover:bg-[#f7f9fb] transition-all border-[#eceef0]">
                         <TableCell className="px-10 py-6">
                            <p className="font-black text-[#191c1e] text-sm group-hover:text-[#059669] transition-colors">{item.name}</p>
                            <p className="text-[10px] font-bold text-[#c2c6d4] mt-0.5 italic">{item.generic_name || "Biological Compound"}</p>
                         </TableCell>
                         <TableCell className="px-6 py-6">
                            <Badge className="bg-[#f2f4f6] text-[#424752] font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                               {item.category || "General"}
                            </Badge>
                         </TableCell>
                         <TableCell className="px-6 py-6">
                            <div className="flex items-center gap-3">
                               <span className={cn(
                                  "font-black text-lg",
                                  item.quantity <= item.threshold ? "text-[#dc2626]" : "text-[#191c1e]"
                               )}>{item.quantity}</span>
                               <div className="flex-1 max-w-[40px] h-1.5 bg-[#f2f4f6] rounded-full overflow-hidden">
                                  <div className={cn(
                                     "h-full rounded-full transition-all duration-500",
                                     item.quantity <= item.threshold ? "bg-[#dc2626]" : "bg-[#16a34a]"
                                  )} style={{ width: `${Math.min(100, (item.quantity / 500) * 100)}%` }} />
                               </div>
                            </div>
                         </TableCell>
                         <TableCell className="px-6 py-6 text-[11px] font-black text-[#727783] uppercase tracking-widest">{item.unit}</TableCell>
                         <TableCell className="px-6 py-6 font-bold text-[#191c1e]">₹ {item.price_per_unit}</TableCell>
                         <TableCell className="px-10 py-6 text-right">
                            <Badge className={cn(
                               "font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-lg border",
                               item.quantity <= item.threshold ? "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]" : "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]"
                            )}>
                               {item.quantity <= item.threshold ? "Critical Stock" : "Regulated Output"}
                            </Badge>
                         </TableCell>
                      </TableRow>
                   ))}
                </TableBody>
             </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



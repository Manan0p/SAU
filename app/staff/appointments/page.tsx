"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays, Stethoscope, Clock, CheckCircle, XCircle, FileSearch, RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAllAppointments, updateAppointmentStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDateTime, formatDate, cn } from "@/lib/utils";
import type { Appointment } from "@/types";

export default function StaffAppointmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [action, setAction] = useState<"complete" | "cancel" | null>(null);
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "all">("upcoming");

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllAppointments();
    // Filter to this doctor's appointments (by doctorId matching user id, or doctorName matching)
    const mine = all.filter(
      (a) => a.doctorId === user?.id || a.doctorName === user?.name
    );
    setAppointments(mine);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async () => {
    if (!selectedAppt || !action) return;
    setProcessing(true);
    const result = await updateAppointmentStatus(selectedAppt.id, action === "complete" ? "completed" : "cancelled");
    setProcessing(false);
    if (result.success) {
      toast({
        title: action === "complete" ? "Appointment confirmed ✓" : "Appointment cancelled",
        variant: action === "complete" ? "success" : "default",
      });
      setSelectedAppt(null);
      setAction(null);
      load();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const upcoming = appointments.filter((a) => a.status === "booked" && new Date(a.timeSlot) >= new Date());
  const displayList = tab === "upcoming" ? upcoming : appointments;

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#fdf4ff] text-[#9333ea] border border-[#f3e8ff] shadow-sm">
              <CalendarDays className="w-7 h-7" />
           </div>
           <div>
              <h1 className="text-3xl font-extrabold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>
                 My Appointments
              </h1>
              <p className="text-[#727783] font-medium mt-1">
                Manage your schedule and confirm upcoming bookings
              </p>
           </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2 bg-white border-[#eceef0] hover:bg-[#f2f4f6]" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Sync
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-[#eceef0] shadow-[0_2px_12px_rgba(25,28,30,0.04)] overflow-hidden">
        <div className="px-8 py-5 border-b border-[#eceef0] flex items-center justify-between bg-[#fcfdfe]">
          <h3 className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>Appointments</h3>
          <div className="flex gap-2 bg-[#f2f4f6] p-1 rounded-xl border border-[#eceef0]">
            {(["upcoming", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-bold transition-all capitalize",
                  tab === t
                    ? "bg-[#191c1e] text-white shadow-md"
                    : "text-[#727783] hover:text-[#191c1e]"
                )}
              >
                {t === "upcoming" ? "Upcoming" : "All History"}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-[#005eb8] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#727783] text-sm font-medium">Loading schedule...</p>
            </div>
          ) : displayList.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#f7f9fb] flex items-center justify-center mb-4 border border-[#eceef0]">
                <CalendarDays className="w-8 h-8 text-[#c2c6d4]" />
              </div>
              <p className="text-[#191c1e] font-bold">No appointments found</p>
              <p className="text-[#727783] text-sm mt-1">Appointments booked with you will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#eceef0] hover:bg-transparent">
                    <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px]">Patient ID</TableHead>
                    <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px]">Specialty</TableHead>
                    <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px]">Date & Time</TableHead>
                    <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px]">Notes</TableHead>
                    <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px]">Status</TableHead>
                    <TableHead className="text-[#727783] font-bold uppercase tracking-widest text-[11px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayList.map((appt) => (
                    <TableRow key={appt.id} className="border-[#eceef0] hover:bg-[#fcfdfe] transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-[#727783]">{appt.userId.slice(0, 8)}…</TableCell>
                      <TableCell className="text-sm text-[#424752] font-semibold">{appt.specialty}</TableCell>
                      <TableCell className="text-sm font-medium text-[#727783]">{formatDateTime(appt.timeSlot)}</TableCell>
                      <TableCell className="text-sm text-[#727783] max-w-[200px] truncate">{appt.notes ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[10px] uppercase font-bold tracking-wider py-0.5 px-2.5",
                          appt.status === "completed" ? "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]" :
                          appt.status === "cancelled" ? "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]" :
                          "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]"
                        )}>
                          {appt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {appt.status === "booked" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="text-xs font-bold bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] border border-[#dcfce7] gap-1.5 rounded-xl h-8 px-3"
                              onClick={() => { setSelectedAppt(appt); setAction("complete"); }}
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs font-bold bg-[#fef2f2] text-[#dc2626] border-[#fee2e2] hover:bg-[#fee2e2] gap-1.5 rounded-xl h-8 px-3"
                              onClick={() => { setSelectedAppt(appt); setAction("cancel"); }}
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#c2c6d4] font-bold">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Confirm/Cancel Dialog */}
      <Dialog open={!!selectedAppt} onOpenChange={(o) => { if (!o) { setSelectedAppt(null); setAction(null); } }}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in-95">
          <div className={cn(
            "p-8 text-white relative",
            action === "complete" ? "bg-[#16a34a]" : "bg-[#dc2626]"
          )}>
            <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'var(--font-manrope)' }}>
              {action === "complete" ? "Confirm Appointment" : "Cancel Appointment"}
            </DialogTitle>
            <DialogDescription className="text-white/80 font-medium mt-1">
              {action === "complete"
                ? "Mark this appointment as confirmed and ready."
                : "Cancel this booked appointment."}
            </DialogDescription>
          </div>
          
          <div className="p-8 space-y-4 bg-white">
            <div className="p-4 rounded-2xl bg-[#f7f9fb] border border-[#eceef0] space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#727783] font-bold text-[11px] uppercase tracking-wider">Patient ID</span>
                <span className="font-mono font-bold text-[#191c1e]">{selectedAppt?.userId.slice(0, 12)}…</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#727783] font-bold text-[11px] uppercase tracking-wider">Specialty</span>
                <span className="font-bold text-[#191c1e]">{selectedAppt?.specialty}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#727783] font-bold text-[11px] uppercase tracking-wider">Time</span>
                <span className="font-bold text-[#00478d]">{selectedAppt ? formatDateTime(selectedAppt.timeSlot) : ""}</span>
              </div>
              {selectedAppt?.notes && (
                <div className="pt-3 mt-3 border-t border-[#eceef0]">
                  <p className="text-xs font-semibold italic text-[#424752]">"{selectedAppt.notes}"</p>
                </div>
              )}
            </div>
            
            <p className="text-xs text-[#727783] font-medium pt-2">
              {action === "complete" ? "The patient will be notified that you have confirmed the schedule." : "This action cannot be undone. The patient will be notified of the cancellation."}
            </p>
          </div>
          <div className="p-6 bg-[#fcfdfe] border-t border-[#eceef0] flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setSelectedAppt(null); setAction(null); }} className="rounded-xl font-bold text-[#727783] hover:bg-[#f2f4f6]">
              Keep Open
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={cn(
                "rounded-xl px-8 font-bold text-white shadow-lg",
                action === "complete" ? "bg-[#16a34a] hover:bg-[#15803d] shadow-[#16a34a]/20" : "bg-[#dc2626] hover:bg-[#b91c1c] shadow-[#dc2626]/20"
              )}
            >
              {processing ? "Processing…" : action === "complete" ? "Confirm & Proceed" : "Yes, Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

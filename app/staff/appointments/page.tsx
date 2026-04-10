"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays, Stethoscope, Clock, CheckCircle, XCircle, FileSearch,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAllAppointments, updateAppointmentStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDateTime, formatDate } from "@/lib/utils";
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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-violet-400" />
          My Appointments
        </h1>
        <p className="text-slate-400">Manage your schedule and confirm upcoming bookings</p>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-white/5 mb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Appointments</CardTitle>
            <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-white/10">
              {(["upcoming", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === t
                      ? "bg-violet-500/20 text-violet-300 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t === "upcoming" ? "Upcoming" : "All History"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="py-20 text-center">
              <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No appointments found</p>
              <p className="text-slate-500 text-sm mt-1">Appointments booked with you will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-slate-400">Patient ID</TableHead>
                  <TableHead className="text-slate-400">Specialty</TableHead>
                  <TableHead className="text-slate-400">Date & Time</TableHead>
                  <TableHead className="text-slate-400">Notes</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayList.map((appt) => (
                  <TableRow key={appt.id} className="border-white/5 hover:bg-white/5 data-[state=selected]:bg-white/5">
                    <TableCell className="font-mono text-xs text-slate-400">{appt.userId.slice(0, 8)}…</TableCell>
                    <TableCell className="text-sm text-slate-300 font-medium">{appt.specialty}</TableCell>
                    <TableCell className="text-sm text-slate-400">{formatDateTime(appt.timeSlot)}</TableCell>
                    <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{appt.notes ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={
                        appt.status === "completed" ? "success" :
                        appt.status === "cancelled" ? "destructive" : "warning"
                      }>
                        {appt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {appt.status === "booked" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20 gap-1.5"
                            onClick={() => { setSelectedAppt(appt); setAction("complete"); }}
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-rose-400 border-rose-500/20 hover:bg-rose-500/10 gap-1.5"
                            onClick={() => { setSelectedAppt(appt); setAction("cancel"); }}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirm/Cancel Dialog */}
      <Dialog open={!!selectedAppt} onOpenChange={(o) => { if (!o) { setSelectedAppt(null); setAction(null); } }}>
        <DialogContent className="border-white/10 bg-slate-900 data-[state=open]:animate-in data-[state=closed]:animate-out fade-in-90 zoom-in-95">
          <DialogHeader>
            <DialogTitle className="text-white">
              {action === "complete" ? "Confirm Appointment" : "Cancel Appointment"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {action === "complete"
                ? "Mark this appointment as completed or confirmed. The patient will be notified."
                : "Are you sure you want to cancel this appointment? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 my-2">
            <p className="text-sm text-slate-300 flex justify-between"><span className="text-slate-500">Patient ID</span> <span className="font-mono text-slate-400">{selectedAppt?.userId.slice(0, 12)}…</span></p>
            <p className="text-sm text-slate-300 flex justify-between"><span className="text-slate-500">Specialty</span> <span>{selectedAppt?.specialty}</span></p>
            <p className="text-sm text-slate-300 flex justify-between"><span className="text-slate-500">Time</span> <span className="font-medium text-white">{selectedAppt ? formatDateTime(selectedAppt.timeSlot) : ""}</span></p>
            {selectedAppt?.notes && <p className="text-sm text-slate-400 italic pt-2 border-t border-white/5 mt-2">"{selectedAppt.notes}"</p>}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white" onClick={() => { setSelectedAppt(null); setAction(null); }}>Go Back</Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={action === "complete" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}
            >
              {processing ? "Processing…" : action === "complete" ? "Confirm Appointment" : "Cancel Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { CalendarDays, Clock, User, Stethoscope, X, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { MOCK_DOCTORS } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";
import type { Doctor } from "@/types";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { upcoming, past, loading, book, cancel } = useAppointments(userId);
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const resetBooking = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedSlot("");
    setNotes("");
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedSlot || !user) return;
    const result = await book({
      userId: user.id,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      timeSlot: selectedSlot,
      date: formatDate(selectedSlot),
      status: "booked",
      notes,
    });
    if (result.success) {
      toast({ title: "Appointment booked! 🗓️", description: `With ${selectedDoctor.name} on ${formatDate(selectedSlot)}`, variant: "success" });
      setBookingOpen(false);
      resetBooking();
    } else {
      toast({ title: "Booking failed", description: result.error, variant: "destructive" });
    }
  };

  const handleCancel = async (id: string) => {
    const result = await cancel(id);
    setCancelId(null);
    if (result.success) {
      toast({ title: "Appointment cancelled", description: "Your appointment has been cancelled.", variant: "default" });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Appointments</h1>
          <p className="text-slate-400">Book and manage your doctor appointments</p>
        </div>
        <Button
          id="book-appointment-btn"
          onClick={() => { resetBooking(); setBookingOpen(true); }}
          className="gap-2"
          size="lg"
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </Button>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-violet-400" />
          Upcoming ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No upcoming appointments</p>
              <Button variant="outline" onClick={() => setBookingOpen(true)}>Book your first appointment</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {upcoming.map((appt) => (
              <Card key={appt.id} className="border-violet-500/10 hover:border-violet-500/30 transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(appt.doctorName.replace("Dr. ", ""))}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{appt.doctorName}</p>
                        <p className="text-xs text-slate-400">{appt.specialty}</p>
                      </div>
                    </div>
                    <Badge variant="default">Booked</Badge>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatDateTime(appt.timeSlot)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <User className="w-3.5 h-3.5" />
                      Ref: <span className="font-mono text-slate-300">{appt.id}</span>
                    </div>
                    {appt.notes && (
                      <p className="text-xs text-slate-500 italic">"{appt.notes}"</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-400 border-red-500/20 hover:bg-red-500/10"
                    onClick={() => setCancelId(appt.id)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-slate-400" />
            Past Appointments ({past.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {past.map((appt) => (
              <Card key={appt.id} className="opacity-60">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold">
                        {getInitials(appt.doctorName.replace("Dr. ", ""))}
                      </div>
                      <div>
                        <p className="font-medium text-slate-300 text-sm">{appt.doctorName}</p>
                        <p className="text-xs text-slate-500">{appt.specialty}</p>
                      </div>
                    </div>
                    <Badge variant={appt.status === "completed" ? "success" : "secondary"}>
                      {appt.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{formatDateTime(appt.timeSlot)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Booking Dialog ────────────────── */}
      <Dialog open={bookingOpen} onOpenChange={(o) => { setBookingOpen(o); if (!o) resetBooking(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "Select a Doctor" : `Choose Time Slot — ${selectedDoctor?.name}`}
            </DialogTitle>
            <DialogDescription>
              {step === 1 ? "Pick a specialist for your appointment" : "Select an available slot"}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {MOCK_DOCTORS.map((doc) => (
                <button
                  key={doc.id}
                  id={`doctor-${doc.id}`}
                  onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/10 text-left transition-all duration-200 group"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {getInitials(doc.name.replace("Dr. ", ""))}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{doc.name}</p>
                    <p className="text-xs text-slate-400">{doc.specialty}</p>
                    <p className="text-xs text-violet-400 mt-1">{doc.available.length} slots available</p>
                  </div>
                  <Stethoscope className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {step === 2 && selectedDoctor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {selectedDoctor.available.map((slot) => (
                  <button
                    key={slot}
                    id={`slot-${slot}`}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-xl border text-sm text-left transition-all duration-200 ${
                      selectedSlot === slot
                        ? "border-violet-500 bg-violet-500/20 text-violet-300"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-violet-500/40"
                    }`}
                  >
                    <p className="font-medium">{formatDate(slot)}</p>
                    <p className="text-xs opacity-70">
                      {new Date(slot).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Reason for visit (optional)</Label>
                <input
                  id="notes"
                  className="flex h-11 w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g. Fever, knee pain, general checkup…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
                <Button
                  id="confirm-booking-btn"
                  onClick={handleBook}
                  disabled={!selectedSlot || loading}
                >
                  {loading ? "Booking…" : "Confirm Appointment"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Cancel Confirm Dialog ─────────── */}
      <Dialog open={!!cancelId} onOpenChange={(o) => { if (!o) setCancelId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment?</DialogTitle>
            <DialogDescription>This action cannot be undone. The slot will become available again.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>Keep it</Button>
            <Button variant="destructive" onClick={() => cancelId && handleCancel(cancelId)}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

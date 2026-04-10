"use client";

import { useState } from "react";
import { CalendarDays, Clock, User, Stethoscope, X, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { MOCK_DOCTORS } from "@/lib/mockData";
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
    <div className="p-10 max-w-6xl mx-auto pb-32" style={{ background: "#f7f9fb", minHeight: "100vh" }}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#d6e3ff" }}>
            <CalendarDays className="w-6 h-6 text-[#00478d]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Appointments</h1>
            <p className="text-sm font-medium" style={{ color: "#727783", fontFamily: "var(--font-public-sans)" }}>Book and manage your doctor appointments</p>
          </div>
        </div>
        <button
          id="book-appointment-btn"
          onClick={() => { resetBooking(); setBookingOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-[0_4px_16px_rgba(0,94,184,0.15)] hover:scale-105"
          style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {/* Upcoming Section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-[#191c1e] mb-5 flex items-center gap-2" style={{ fontFamily: 'var(--font-manrope)' }}>
          <Clock className="w-5 h-5 text-[#00478d]" />
          Upcoming ({upcoming.length})
        </h2>
        
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center flex flex-col items-center shadow-[0_2px_12px_rgba(25,28,30,0.04)]">
            <div className="w-16 h-16 bg-[#f2f4f6] rounded-2xl flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-[#727783]" />
            </div>
            <p className="text-base font-semibold text-[#191c1e] mb-1">No upcoming appointments</p>
            <p className="text-sm text-[#727783] mb-6">You don't have any medical appointments scheduled at the moment.</p>
            <button 
              onClick={() => setBookingOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#eceef0] text-[#191c1e] text-sm font-semibold hover:bg-[#e0e3e5] transition-colors"
            >
              Book your first appointment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {upcoming.map((appt) => (
              <div 
                key={appt.id} 
                className="bg-white rounded-3xl p-6 relative overflow-hidden group shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0] transition-transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-sm" style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}>
                      {getInitials(appt.doctorName.replace("Dr. ", ""))}
                    </div>
                    <div>
                      <p className="font-bold text-[#191c1e] text-base" style={{ fontFamily: 'var(--font-manrope)' }}>{appt.doctorName}</p>
                      <p className="text-xs font-semibold text-[#727783]">{appt.specialty}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#d6e3ff] text-[#00478d]">
                    Booked
                  </span>
                </div>
                
                <div className="bg-[#f7f9fb] rounded-2xl p-4 mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[#424752] font-medium">
                    <CalendarDays className="w-4 h-4 text-[#005eb8]" />
                    {formatDateTime(appt.timeSlot)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#727783]">
                    <User className="w-4 h-4 text-[#c2c6d4]" />
                    Ref: <span className="font-mono text-[#424752]">{appt.id}</span>
                  </div>
                  {appt.notes && (
                    <div className="pt-2 mt-2 border-t border-[#eceef0]">
                      <p className="text-xs text-[#727783] italic">"{appt.notes}"</p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setCancelId(appt.id)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab] transition-colors"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Cancel Appointment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Section */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-[#191c1e] mb-5 flex items-center gap-2" style={{ fontFamily: 'var(--font-manrope)' }}>
            <Stethoscope className="w-5 h-5 text-[#4a6078]" />
            Past Appointments ({past.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {past.map((appt) => (
              <div 
                key={appt.id} 
                className="bg-[#ffffff] rounded-3xl p-5 shadow-[0_2px_12px_rgba(25,28,30,0.02)] border border-[#eceef0] opacity-80"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#eceef0] flex items-center justify-center text-[#424752] text-xs font-bold">
                      {getInitials(appt.doctorName.replace("Dr. ", ""))}
                    </div>
                    <div>
                      <p className="font-bold text-[#191c1e] text-sm" style={{ fontFamily: 'var(--font-manrope)' }}>{appt.doctorName}</p>
                      <p className="text-xs text-[#727783] font-medium">{appt.specialty}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${appt.status === 'completed' ? 'bg-[#cae2fe] text-[#00478d]' : 'bg-[#e0e3e5] text-[#424752]'}`}>
                    {appt.status}
                  </span>
                </div>
                <div className="px-1">
                  <p className="text-xs text-[#727783] font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateTime(appt.timeSlot)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Booking Dialog ────────────────── */}
      <Dialog open={bookingOpen} onOpenChange={(o) => { setBookingOpen(o); if (!o) resetBooking(); }}>
        <DialogContent className="sm:max-w-2xl rounded-3xl p-8 border-none bg-white shadow-[0_24px_60px_rgba(25,28,30,0.15)]">
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#d6e3ff] flex items-center justify-center mb-4">
               <CalendarDays className="w-6 h-6 text-[#00478d]" />
            </div>
            <DialogTitle className="text-2xl font-bold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>
              {step === 1 ? "Select a Specialist" : `Book — ${selectedDoctor?.name}`}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#727783] mt-2">
              {step === 1 ? "Choose a campus doctor for your appointment." : "Select an available time slot below."}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {MOCK_DOCTORS.map((doc) => (
                <button
                  key={doc.id}
                  id={`doctor-${doc.id}`}
                  onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#f7f9fb] border border-[#eceef0] hover:border-[#cae2fe] hover:shadow-[0_4px_12px_rgba(0,94,184,0.05)] text-left transition-all duration-200 group"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}>
                    {getInitials(doc.name.replace("Dr. ", ""))}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#191c1e] text-base" style={{ fontFamily: 'var(--font-manrope)' }}>{doc.name}</p>
                    <p className="text-xs font-medium text-[#727783]">{doc.specialty}</p>
                    <p className="text-xs font-bold text-[#00478d] mt-1 bg-[#d6e3ff] inline-block px-2 py-0.5 rounded-md">{doc.available.length} slots available</p>
                  </div>
                  <Stethoscope className="w-5 h-5 text-[#c2c6d4] group-hover:text-[#005eb8] transition-colors" />
                </button>
              ))}
            </div>
          )}

          {step === 2 && selectedDoctor && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {selectedDoctor.available.map((slot) => (
                  <button
                    key={slot}
                    id={`slot-${slot}`}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                      selectedSlot === slot
                        ? "border-[#005eb8] bg-[#cae2fe] shadow-[0_4px_12px_rgba(0,94,184,0.1)]"
                        : "border-[#e0e3e5] bg-[#f7f9fb] hover:border-[#a9c7ff] hover:bg-white"
                    }`}
                  >
                    <p className="font-bold text-[#191c1e] mb-1" style={{ fontFamily: 'var(--font-manrope)' }}>{formatDate(slot)}</p>
                    <p className={`text-xs font-medium ${selectedSlot === slot ? "text-[#00478d]" : "text-[#727783]"}`}>
                      {new Date(slot).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Reason for visit <span className="lowercase tracking-normal">(optional)</span></label>
                <input
                  id="notes"
                  className="w-full bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:bg-white focus:border-[#cae2fe] focus:ring-4 focus:ring-[#cae2fe]/40 transition-all outline-none"
                  placeholder="e.g. Fever, general checkup…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <DialogFooter className="gap-3 pt-4 flex-row w-full justify-end">
                <button 
                   onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-xl text-sm font-semibold bg-[#eceef0] text-[#424752] hover:bg-[#e0e3e5] transition-colors"
                >
                  ← Back
                </button>
                <button
                  id="confirm-booking-btn"
                  onClick={handleBook}
                  disabled={!selectedSlot || loading}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all shadow-[0_4px_16px_rgba(0,94,184,0.15)] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
                >
                  {loading ? "Booking…" : "Confirm Appointment"}
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  AlertTriangle, CheckCircle, Heart, MapPin, Phone, Shield, Siren, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSos } from "@/hooks/useSos";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDateTime } from "@/lib/utils";

type SosState = "idle" | "confirming" | "sending" | "active";

export default function SosPage() {
  const { user } = useAuth();
  const { activeSos, history, loading, triggerSos, resolveOwn } = useSos(user?.id ?? "");
  const { toast } = useToast();

  const [uiState, setUiState] = useState<SosState>(activeSos ? "active" : "idle");
  const [message, setMessage] = useState("");

  // Keep uiState in sync when an existing activeSos is found
  if (activeSos && uiState === "idle") setUiState("active");

  const handleSosClick = () => setUiState("confirming");

  const handleConfirm = async () => {
    if (!user) return;
    setUiState("sending");

    const result = await triggerSos(
      user.name,
      user.phone,
      user.college_id ?? user.studentId,
      message || undefined
    );

    if (result.success) {
      setUiState("active");

      // Notify nearby responders via API
      fetch("/api/sos/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sosId: result }), // result.sos.id in real hook
      }).catch(() => {/* non-blocking */});

      toast({
        title: "🚨 SOS Alert Sent!",
        description: "Campus health team has been notified. Help is on the way.",
        variant: "destructive",
      });
    } else {
      setUiState("idle");
      toast({ title: "SOS Failed", description: result.error, variant: "destructive" });
    }
  };

  const handleResolve = async () => {
    if (!activeSos) return;
    const result = await resolveOwn(activeSos.id);
    if (result.success) {
      setUiState("idle");
      setMessage("");
      toast({ title: "SOS resolved", description: "Alert has been closed.", variant: "default" });
    }
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ba1a1a] text-white">Active</span>;
    if (status === "responding") return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Responding</span>;
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#d6e3ff] text-[#00478d]">Resolved</span>;
  };

  return (
    <div className="p-10 max-w-6xl mx-auto pb-32" style={{ background: "#f7f9fb", minHeight: "100vh" }}>
      
      {/* Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#191c1e] mb-3 flex items-center justify-center gap-3 tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#ffdad6]">
            <Siren className="w-6 h-6 text-[#ba1a1a]" />
          </div>
          Emergency SOS
        </h1>
        <p className="text-sm font-medium text-[#727783]" style={{ fontFamily: "var(--font-public-sans)" }}>
          Use only in genuine medical emergencies. Your GPS location will be immediately shared with campus health authorities.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Main SOS Button / Active State */}
        {uiState === "active" && activeSos ? (
          <div className="bg-[#ba1a1a]/5 border border-[#ba1a1a]/20 rounded-3xl p-8 text-center space-y-5 shadow-[0_4px_24px_rgba(186,26,26,0.05)]">
            <div className="relative inline-flex items-center justify-center mb-2">
              <div className="absolute w-32 h-32 rounded-full bg-[#ba1a1a]/15 animate-ping" style={{ animationDuration: "1.5s" }} />
              <div className="w-24 h-24 rounded-full bg-[#ba1a1a]/10 border-4 border-[#ba1a1a] flex items-center justify-center relative z-10 bg-white">
                <AlertTriangle className="w-10 h-10 text-[#ba1a1a]" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#ba1a1a] mb-1" style={{ fontFamily: 'var(--font-manrope)' }}>SOS Alert Active</h2>
              <p className="text-[#424752] text-sm font-medium">Help is on the way. Stay where you are.</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              {statusBadge(activeSos.status)}
            </div>
            <div className="text-sm font-medium text-[#727783] bg-white rounded-2xl p-4 inline-block shadow-sm text-left mx-auto border border-[#f2f4f6]">
              <p className="mb-1"><span className="text-[#c2c6d4]">📍 Location:</span> {activeSos.lat.toFixed(5)}, {activeSos.lng.toFixed(5)}</p>
              <p className="mb-1"><span className="text-[#c2c6d4]">🕐 Sent:</span> {formatDateTime(activeSos.created_at)}</p>
              {activeSos.accuracy && <p><span className="text-[#c2c6d4]">🎯 Accuracy:</span> ±{Math.round(activeSos.accuracy)}m</p>}
            </div>
            <div className="pt-2">
              <button
                onClick={handleResolve}
                className="flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-xl text-sm font-bold bg-white text-[#00478d] border border-[#d6e3ff] shadow-sm hover:bg-[#f7f9fb] transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                I'm Safe — Resolve SOS
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="relative inline-flex items-center justify-center mb-10">
              {uiState !== "sending" && (
                <>
                  <div className="absolute w-60 h-60 rounded-full bg-[#ffdad6]/50 animate-ping" style={{ animationDuration: "1.5s" }} />
                  <div className="absolute w-48 h-48 rounded-full bg-[#ffdad6] animate-ping" style={{ animationDuration: "1.8s" }} />
                </>
              )}
              <button
                id="sos-button"
                onClick={handleSosClick}
                disabled={uiState === "sending" || loading}
                className="relative w-44 h-44 rounded-full bg-gradient-to-br from-[#e63939] to-[#ba1a1a] border-4 border-white flex flex-col items-center justify-center shadow-[0_12px_40px_rgba(186,26,26,0.3)] hover:shadow-[0_16px_50px_rgba(186,26,26,0.4)] hover:scale-[1.03] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                aria-label="Activate Emergency SOS"
              >
                {uiState === "sending" ? (
                  <>
                    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                    <span className="text-white text-sm font-bold uppercase tracking-widest">Locating…</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-12 h-12 text-white mb-2" />
                    <span className="text-white font-black text-2xl leading-none mb-1 tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>SOS</span>
                    <span className="text-[#ffdad6] text-xs font-bold uppercase tracking-widest">Tap for help</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Emergency Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl p-5 text-center shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0] transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center mx-auto mb-3">
              <Phone className="w-5 h-5 text-[#ba1a1a]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#727783] mb-1">Campus Helpline</p>
            <p className="text-[#191c1e] font-bold text-base" style={{ fontFamily: 'var(--font-manrope)' }}>1800-SAU-HELP</p>
          </div>
          <div className="bg-white rounded-3xl p-5 text-center shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0] transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-full bg-[#f2f4f6] flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-5 h-5 text-[#424752]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#727783] mb-1">Health Center</p>
            <p className="text-[#191c1e] font-bold text-base" style={{ fontFamily: 'var(--font-manrope)' }}>Block C, Gate 2</p>
          </div>
          <div className="bg-white rounded-3xl p-5 text-center shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0] transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 rounded-full bg-[#d6e3ff] flex items-center justify-center mx-auto mb-3">
              <Heart className="w-5 h-5 text-[#00478d]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#727783] mb-1">Ambulance</p>
            <p className="text-[#191c1e] font-bold text-base" style={{ fontFamily: 'var(--font-manrope)' }}>112x (National)</p>
          </div>
        </div>

        {/* What happens info */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#f7f9fb] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#4a6078]" />
            </div>
            <p className="text-xl font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>What happens when you press SOS?</p>
          </div>
          <div className="space-y-4">
            {[
              "Your live GPS location is captured via browser geolocation",
              `Your student details (${user?.name}, ${user?.college_id ?? user?.studentId}) are included`,
              "Alert is saved to the system and sent to doctors, pharmacy & medical center",
              "Nearby users within 100m are notified in real-time",
              "You receive a confirmation and help team responds",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-[#f2f4f6] flex items-center justify-center text-[#4a6078] text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm font-medium text-[#424752] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SOS History */}
        {history.length > 0 && (
          <div className="bg-white rounded-3xl p-8 shadow-[0_2px_12px_rgba(25,28,30,0.04)] border border-[#eceef0]">
            <div className="flex items-center gap-3 mb-6">
              <p className="text-lg font-bold text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>SOS History</p>
            </div>
            <div className="space-y-3">
              {history.slice(0, 5).map((sos) => (
                <div key={sos.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#f7f9fb] border border-[#eceef0]">
                  <div>
                    <p className="text-sm font-bold text-[#191c1e] mb-1">{formatDateTime(sos.created_at)}</p>
                    <p className="text-xs font-medium text-[#727783] flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#c2c6d4]" /> {sos.lat.toFixed(4)}, {sos.lng.toFixed(4)}
                    </p>
                  </div>
                  {statusBadge(sos.status)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={uiState === "confirming"} onOpenChange={(o) => { if (!o) setUiState("idle"); }}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 border-none bg-white shadow-[0_24px_60px_rgba(186,26,26,0.15)]">
          <DialogHeader className="mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] flex items-center justify-center mb-4">
               <AlertTriangle className="w-6 h-6 text-[#ba1a1a]" />
            </div>
            <DialogTitle className="text-2xl font-bold text-[#191c1e]" style={{ fontFamily: "var(--font-manrope)" }}>
              Confirm Emergency SOS
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-[#727783] mt-2 leading-relaxed">
              This will immediately alert the SAU Campus Health Team with your live GPS location. Only proceed if this is a genuine medical emergency.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 text-sm font-medium text-[#424752] bg-[#f7f9fb] rounded-2xl px-5 border border-[#eceef0] my-4">
            <p className="flex justify-between items-center"><span className="text-[#a8adb8] text-xs uppercase tracking-widest font-bold">Name</span> <span className="font-bold text-[#191c1e]">{user?.name}</span></p>
            <p className="flex justify-between items-center"><span className="text-[#a8adb8] text-xs uppercase tracking-widest font-bold">ID</span> <span className="font-mono text-[#191c1e]">{user?.college_id ?? user?.studentId}</span></p>
            <p className="flex justify-between items-center"><span className="text-[#a8adb8] text-xs uppercase tracking-widest font-bold">Location</span> <span>Captured via GPS</span></p>
          </div>

          <div className="space-y-2 mb-6">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#727783]">Optional Details <span className="lowercase tracking-normal">(e.g. chest pain)</span></label>
            <input
              className="w-full bg-[#ffffff] border border-[#e0e3e5] rounded-xl px-4 py-3 text-sm text-[#191c1e] placeholder-[#c2c6d4] focus:bg-white focus:border-[#ba1a1a] focus:ring-4 focus:ring-[#ba1a1a]/20 transition-all outline-none"
              placeholder="Briefly describe what happened…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-3 sm:gap-2 flex-col sm:flex-row w-full justify-end">
            <button
              onClick={() => setUiState("idle")}
              className="px-5 py-3 rounded-xl text-sm font-semibold bg-[#eceef0] text-[#424752] hover:bg-[#e0e3e5] transition-colors w-full sm:w-auto text-center"
            >
              Cancel
            </button>
            <button
              id="confirm-sos-btn"
              disabled={loading}
              onClick={handleConfirm}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-[0_4px_16px_rgba(186,26,26,0.25)] hover:bg-[#e63939] hover:scale-105 disabled:opacity-50 w-full sm:w-auto flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #ba1a1a, #e63939)" }}
            >
              <AlertTriangle className="w-4 h-4" />
              Yes, Send SOS Alert
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

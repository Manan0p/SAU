"use client";

import { useState } from "react";
import {
  AlertTriangle, CheckCircle, Heart, MapPin, Phone, Shield, Siren, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSos } from "@/hooks/useSos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    if (status === "active") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Active</Badge>;
    if (status === "responding") return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Responding</Badge>;
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Resolved</Badge>;
  };

  return (
    <div className="p-8 min-h-screen space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Siren className="w-8 h-8 text-red-400" />
          Emergency SOS
        </h1>
        <p className="text-slate-400">
          Use only in genuine medical emergencies. Your GPS location will be shared with campus health authorities.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Main SOS Button / Active State */}
        {uiState === "active" && activeSos ? (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-6 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute w-28 h-28 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: "1.5s" }} />
                <div className="w-20 h-20 rounded-full bg-red-500/30 border-2 border-red-500/50 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-300 mb-1">SOS Alert Active</h2>
                <p className="text-slate-400 text-sm">Help is on the way. Stay where you are.</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {statusBadge(activeSos.status)}
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <p>📍 Location: {activeSos.lat.toFixed(5)}, {activeSos.lng.toFixed(5)}</p>
                <p>🕐 Sent: {formatDateTime(activeSos.created_at)}</p>
                {activeSos.accuracy && <p>🎯 Accuracy: ±{Math.round(activeSos.accuracy)}m</p>}
              </div>
              <Button
                variant="outline"
                onClick={handleResolve}
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I'm Safe — Resolve SOS
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <div className="relative inline-flex items-center justify-center mb-8">
              {uiState !== "sending" && (
                <>
                  <div className="absolute w-56 h-56 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: "1.5s" }} />
                  <div className="absolute w-44 h-44 rounded-full bg-red-500/15 animate-ping" style={{ animationDuration: "1.8s" }} />
                </>
              )}
              <button
                id="sos-button"
                onClick={handleSosClick}
                disabled={uiState === "sending" || loading}
                className="relative w-40 h-40 rounded-full bg-gradient-to-br from-red-500 to-red-700 border-4 border-red-400/30 flex flex-col items-center justify-center shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                aria-label="Activate Emergency SOS"
              >
                {uiState === "sending" ? (
                  <>
                    <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin mb-2" />
                    <span className="text-white text-xs font-semibold">Locating…</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-12 h-12 text-white mb-1" />
                    <span className="text-white font-bold text-lg leading-tight">SOS</span>
                    <span className="text-red-200 text-xs">TAP FOR HELP</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Press the button to send your live GPS location and student details to the campus health team.
            </p>
          </div>
        )}

        {/* Emergency Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-red-500/20">
            <CardContent className="p-4 text-center">
              <Phone className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-1">Campus Helpline</p>
              <p className="text-white font-bold text-sm">1800-SAU-HELP</p>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20">
            <CardContent className="p-4 text-center">
              <MapPin className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-1">Health Center</p>
              <p className="text-white font-bold text-sm">Block C, Gate 2</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20">
            <CardContent className="p-4 text-center">
              <Heart className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-1">Ambulance</p>
              <p className="text-white font-bold text-sm">108 (National)</p>
            </CardContent>
          </Card>
        </div>

        {/* What happens info */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-violet-400" />
              <p className="font-semibold text-white">What happens when you press SOS?</p>
            </div>
            <div className="space-y-3">
              {[
                "Your live GPS location is captured via browser geolocation",
                `Your student details (${user?.name}, ${user?.college_id ?? user?.studentId}) are included`,
                "Alert is saved to the system and sent to doctors, pharmacy & medical center",
                "Nearby users within 100m are notified in real-time",
                "You receive a confirmation and help team responds",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SOS History */}
        {history.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <p className="font-semibold text-white mb-4">SOS History</p>
              <div className="space-y-3">
                {history.slice(0, 5).map((sos) => (
                  <div key={sos.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-xs text-slate-300">{formatDateTime(sos.created_at)}</p>
                      <p className="text-xs text-slate-500">
                        📍 {sos.lat.toFixed(4)}, {sos.lng.toFixed(4)}
                      </p>
                    </div>
                    {statusBadge(sos.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={uiState === "confirming"} onOpenChange={(o) => { if (!o) setUiState("idle"); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirm Emergency SOS
            </DialogTitle>
            <DialogDescription>
              This will immediately alert the SAU Campus Health Team with your live GPS location. Only proceed if this is a genuine emergency.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2 text-sm text-slate-300">
            <p>📌 <strong>Name:</strong> {user?.name}</p>
            <p>🪪 <strong>ID:</strong> {user?.college_id ?? user?.studentId}</p>
            <p>📱 <strong>Phone:</strong> {user?.phone ?? "Not set"}</p>
            <p>📍 <strong>Location:</strong> Will be captured from device GPS</p>
            <p>🕐 <strong>Time:</strong> {new Date().toLocaleTimeString("en-IN")}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Optional: Describe the emergency</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g. Chest pain, unconscious, broken bone…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUiState("idle")}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button id="confirm-sos-btn" variant="destructive" onClick={handleConfirm}>
              <AlertTriangle className="w-4 h-4 mr-1" />
              Yes, Send SOS Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

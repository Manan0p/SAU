"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Phone,
  MapPin,
  CheckCircle,
  Heart,
  Shield,
  Siren,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";

type SosStatus = "idle" | "confirming" | "sending" | "sent";

export default function SosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<SosStatus>("idle");
  const [sentAt, setSentAt] = useState<string>("");

  const handleSosClick = () => setStatus("confirming");

  const handleConfirm = async () => {
    setStatus("sending");
    // Simulate sending alert with location + user details
    await new Promise((res) => setTimeout(res, 2000));
    setSentAt(new Date().toLocaleTimeString("en-IN"));
    setStatus("sent");
    toast({
      title: "🚨 SOS Alert Sent!",
      description: "Campus health team has been notified. Help is on the way.",
      variant: "destructive",
    });
  };

  const handleReset = () => {
    setStatus("idle");
    setSentAt("");
  };

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <Siren className="w-8 h-8 text-red-400" />
          Emergency SOS
        </h1>
        <p className="text-slate-400">
          Use this only in genuine medical emergencies. Your location and identity will be shared with campus health authorities.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Main SOS Button */}
        {status !== "sent" ? (
          <div className="text-center py-12">
            <div className="relative inline-flex items-center justify-center mb-8">
              {/* Pulse rings */}
              <div className="absolute w-56 h-56 rounded-full bg-red-500/10 animate-ping" style={{ animationDuration: "1.5s" }} />
              <div className="absolute w-44 h-44 rounded-full bg-red-500/15 animate-ping" style={{ animationDuration: "1.8s" }} />
              {/* Main button */}
              <button
                id="sos-button"
                onClick={handleSosClick}
                disabled={status === "sending"}
                className="relative w-40 h-40 rounded-full bg-gradient-to-br from-red-500 to-red-700 border-4 border-red-400/30 flex flex-col items-center justify-center shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                aria-label="Activate Emergency SOS"
              >
                {status === "sending" ? (
                  <>
                    <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin mb-2" />
                    <span className="text-white text-xs font-semibold">Sending…</span>
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
              Press the button above to send an emergency alert to the campus health team with your location.
            </p>
          </div>
        ) : (
          /* Success State */
          <div className="text-center py-12">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Alert Sent Successfully</h2>
            <p className="text-slate-400 mb-1">Sent at {sentAt}</p>
            <p className="text-emerald-400 text-sm mb-8">Campus health team has been notified. Stay where you are.</p>
            <Button variant="outline" onClick={handleReset}>Reset SOS</Button>
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

        {/* What happens */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-violet-400" />
              <p className="font-semibold text-white">What happens when you press SOS?</p>
            </div>
            <div className="space-y-3">
              {[
                { num: "1", text: "Your current location is captured via browser GPS" },
                { num: "2", text: `Your student details (${user?.name}, ${user?.studentId}) are included` },
                { num: "3", text: "Alert is sent to the campus health team and security" },
                { num: "4", text: "You receive a confirmation with an ETA" },
              ].map(({ num, text }) => (
                <div key={num} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">
                    {num}
                  </div>
                  <p className="text-sm text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={status === "confirming"} onOpenChange={(o) => { if (!o) setStatus("idle"); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirm Emergency SOS
            </DialogTitle>
            <DialogDescription>
              This will immediately alert the SAU Campus Health Team with your location and student details. Only proceed if this is a genuine emergency.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2 text-sm text-slate-300">
            <p>📌 <strong>Name:</strong> {user?.name}</p>
            <p>🪪 <strong>Student ID:</strong> {user?.studentId}</p>
            <p>📍 <strong>Location:</strong> Simulated — SAU Campus</p>
            <p>🕐 <strong>Time:</strong> {new Date().toLocaleTimeString("en-IN")}</p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setStatus("idle")}>
              Cancel — Not an emergency
            </Button>
            <Button
              id="confirm-sos-btn"
              variant="destructive"
              onClick={handleConfirm}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Yes, Send SOS Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

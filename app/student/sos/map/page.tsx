"use client";

import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { AlertTriangle, CheckCircle, Clock, Map, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSosMonitor } from "@/hooks/useSos";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDateTime } from "@/lib/utils";
import type { SosRequest } from "@/types";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

// Default center: SAU Delhi campus approximate
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const MAP_OPTIONS: google.maps.MapOptions = {
  styles: [
    { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1829" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  ],
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  fullscreenControl: true,
};

function SosMapContent() {
  const { user, hasRole } = useAuth();
  const { activeSosRequests, allSosRequests, loading, respond, resolve } = useSosMonitor();
  const { toast } = useToast();

  const [selectedSos, setSelectedSos] = useState<SosRequest | null>(null);
  const [resolveTarget, setResolveTarget] = useState<SosRequest | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showAll, setShowAll] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: apiKey });

  const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const displayed = showAll ? allSosRequests : activeSosRequests;

  const handleRespond = async (sos: SosRequest) => {
    const result = await respond(sos.id);
    if (result.success) {
      toast({ title: "Marked as Responding", description: "Students notified.", variant: "success" });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setSelectedSos(null);
  };

  const handleResolve = async () => {
    if (!resolveTarget || !user) return;
    const result = await resolve(resolveTarget.id, user.id, resolveNote || "Resolved by responder");
    if (result.success) {
      toast({ title: "✅ SOS Resolved", description: "Alert has been closed.", variant: "success" });
      setResolveTarget(null);
      setResolveNote("");
      setSelectedSos(null);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  if (!hasRole("doctor") && !hasRole("medical_center") && !hasRole("admin") && !hasRole("pharmacy")) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-slate-400">SOS Map is only available to authorized responders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Map className="w-6 h-6 text-red-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Global SOS Map</h1>
            <p className="text-slate-400 text-sm">Real-time emergency monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Active</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />Responding</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />Resolved</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="gap-2 text-xs"
          >
            {showAll ? "Show Active Only" : "Show All"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          {!isLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Loading Google Maps…</p>
                {!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE" && (
                  <p className="text-amber-400 text-xs mt-2">⚠️ Add your API key to .env.local</p>
                )}
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={DEFAULT_CENTER}
              zoom={15}
              options={MAP_OPTIONS}
              onLoad={onLoad}
              onUnmount={onUnmount}
            >
              {displayed.map((sos) => (
                <Marker
                  key={sos.id}
                  position={{ lat: sos.lat, lng: sos.lng }}
                  onClick={() => setSelectedSos(sos)}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: sos.status === "resolved" ? "#22c55e" : sos.status === "responding" ? "#f59e0b" : "#ef4444",
                    fillOpacity: 1,
                    strokeColor: "#fff",
                    strokeWeight: 2,
                  }}
                />
              ))}

              {selectedSos && (
                <InfoWindow
                  position={{ lat: selectedSos.lat, lng: selectedSos.lng }}
                  onCloseClick={() => setSelectedSos(null)}
                >
                  <div className="bg-slate-900 text-white p-3 rounded-lg min-w-[220px] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm">{selectedSos.userName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        selectedSos.status === "resolved" ? "bg-emerald-500/20 text-emerald-400" :
                        selectedSos.status === "responding" ? "bg-amber-500/20 text-amber-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>{selectedSos.status}</span>
                    </div>
                    {selectedSos.collegeId && <p className="text-xs text-slate-400">ID: {selectedSos.collegeId}</p>}
                    {selectedSos.userPhone && <p className="text-xs text-slate-400">📱 {selectedSos.userPhone}</p>}
                    {selectedSos.message && <p className="text-xs text-slate-300 italic">"{selectedSos.message}"</p>}
                    <p className="text-xs text-slate-500">{formatDateTime(selectedSos.created_at)}</p>
                    {selectedSos.status === "active" && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleRespond(selectedSos)}
                          className="flex-1 text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg px-2 py-1.5 transition-colors"
                        >
                          Respond
                        </button>
                        <button
                          onClick={() => { setResolveTarget(selectedSos); setSelectedSos(null); }}
                          className="flex-1 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg px-2 py-1.5 transition-colors"
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                    {selectedSos.status === "responding" && (
                      <button
                        onClick={() => { setResolveTarget(selectedSos); setSelectedSos(null); }}
                        className="w-full text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg px-2 py-1.5 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>

        {/* Sidebar Panel */}
        <div className="w-80 border-l border-white/5 overflow-y-auto bg-slate-950/80 backdrop-blur">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-white text-sm">
                {showAll ? "All Alerts" : "Active Alerts"} ({displayed.length})
              </p>
              {loading && <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />}
            </div>

            {displayed.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No active SOS alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((sos) => (
                  <button
                    key={sos.id}
                    onClick={() => { setSelectedSos(sos); map?.panTo({ lat: sos.lat, lng: sos.lng }); map?.setZoom(17); }}
                    className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-white truncate">{sos.userName}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md shrink-0 ${
                        sos.status === "resolved" ? "bg-emerald-500/20 text-emerald-400" :
                        sos.status === "responding" ? "bg-amber-500/20 text-amber-400" :
                        "bg-red-500/20 text-red-400 animate-pulse"
                      }`}>{sos.status}</span>
                    </div>
                    {sos.message && <p className="text-xs text-slate-400 truncate italic">"{sos.message}"</p>}
                    <p className="text-xs text-slate-600 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatDateTime(sos.created_at)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveTarget} onOpenChange={(o) => { if (!o) { setResolveTarget(null); setResolveNote(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Resolve SOS Alert
            </DialogTitle>
            <DialogDescription>
              Mark this emergency as resolved. The student will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Resolution note</label>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={3}
              placeholder="e.g. Student treated on-site, no ambulance required."
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveTarget(null)}>Cancel</Button>
            <Button onClick={handleResolve} className="bg-emerald-600 hover:bg-emerald-700">
              Confirm Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SosMapPage() {
  return <SosMapContent />;
}


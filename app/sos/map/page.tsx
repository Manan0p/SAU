"use client";

import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { AlertTriangle, CheckCircle, Clock, Map, RefreshCw, ShieldAlert, ArrowRight, Zap, History, Navigation } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSosMonitor } from "@/hooks/useSos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ToastProvider";
import { formatDateTime, cn } from "@/lib/utils";
import type { SosRequest } from "@/types";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 28.6139, lng: 77.2090 };

const MAP_OPTIONS: google.maps.MapOptions = {
  styles: [
    { elementType: "geometry", stylers: [{ color: "#f7f9fb" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#727783" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#eceef0" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#d1d5db" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#cae2fe" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#f1f5f9" }] },
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
      toast({ title: "Response Protocol Active", description: "Student has been notified of your vector.", variant: "success" });
    } else {
      toast({ title: "Signal Error", description: result.error, variant: "destructive" });
    }
    setSelectedSos(null);
  };

  const handleResolve = async () => {
    if (!resolveTarget || !user) return;
    const result = await resolve(resolveTarget.id, user.id, resolveNote || "Resolved by clinical responder");
    if (result.success) {
      toast({ title: "✅ Event Resolved", description: "The SOS alert has been securely closed.", variant: "success" });
      setResolveTarget(null);
      setResolveNote("");
      setSelectedSos(null);
    } else {
      toast({ title: "Resolution Error", description: result.error, variant: "destructive" });
    }
  };

  if (!hasRole("doctor") && !hasRole("medical_center") && !hasRole("admin") && !hasRole("pharmacy")) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f7f9fb]">
        <div className="text-center p-10 bg-white rounded-[3rem] shadow-xl border border-[#eceef0]">
          <div className="w-20 h-20 rounded-3xl bg-[#fef2f2] flex items-center justify-center mx-auto mb-6">
             <ShieldAlert className="w-10 h-10 text-[#dc2626]" />
          </div>
          <h2 className="text-2xl font-black text-[#191c1e] mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>Access Restricted</h2>
          <p className="text-[#727783] font-medium max-w-xs mx-auto text-sm">Real-time SOS telemetry is only available to authorized clinical responders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#f7f9fb" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-[#eceef0] bg-white/80 backdrop-blur-md relative z-10 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#dc2626] text-white shadow-xl shadow-[#dc2626]/20">
              <Zap className="w-6 h-6 animate-pulse" />
           </div>
           <div>
              <h1 className="text-2xl font-black text-[#191c1e] tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Intelligence Command Map</h1>
              <p className="text-[#727783] text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">Live Telemetry · <span className="text-[#dc2626]">Emergency Priority</span></p>
           </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="hidden lg:flex items-center gap-6 px-6 py-2.5 bg-[#f7f9fb] border border-[#eceef0] rounded-2xl">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#dc2626] animate-ping" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#191c1e]">Active</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#d97706]" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#727783]">Responding</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#727783]">Resolved</span>
              </div>
           </div>

           <button
             onClick={() => setShowAll(!showAll)}
             className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-[#eceef0] bg-white text-[#424752] hover:text-[#00478d] hover:bg-[#d6e3ff]/10 text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
           >
             <History className="w-4 h-4" />
             {showAll ? "Active Stream Only" : "Archive Access"}
           </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Map Container */}
        <div className="flex-1 relative bg-white m-4 rounded-[2.5rem] overflow-hidden border border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.06)]">
          {!isLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f7f9fb]">
              <div className="w-16 h-16 border-4 border-[#00478d] border-t-transparent rounded-full animate-spin mb-6" />
              <p className="text-[#727783] text-[10px] font-black uppercase tracking-[0.3em]">Calibrating Satellite Stream...</p>
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
                    scale: 14,
                    fillColor: sos.status === "resolved" ? "#16a34a" : sos.status === "responding" ? "#d97706" : "#dc2626",
                    fillOpacity: 0.9,
                    strokeColor: "#ffffff",
                    strokeWeight: 4,
                  }}
                />
              ))}

              {selectedSos && (
                <InfoWindow
                  position={{ lat: selectedSos.lat, lng: selectedSos.lng }}
                  onCloseClick={() => setSelectedSos(null)}
                >
                  <div className="bg-white text-[#191c1e] p-4 rounded-xl min-w-[260px] shadow-2xl border border-[#eceef0]">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p className="font-black text-sm tracking-tight">{selectedSos.userName}</p>
                      <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-widest border",
                        selectedSos.status === "resolved" ? "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]" :
                        selectedSos.status === "responding" ? "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]" :
                        "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2]"
                      )}>{selectedSos.status}</Badge>
                    </div>
                    {selectedSos.userPhone && <p className="text-xs text-[#727783] font-bold flex items-center gap-2 mb-1">
                      <Navigation className="w-3 h-3 opacity-40" /> {selectedSos.userPhone}
                    </p>}
                    {selectedSos.message && <p className="text-xs text-[#424752] italic font-medium bg-[#f7f9fb] p-2 rounded-lg border border-[#eceef0] my-3">
                       "{selectedSos.message}"
                    </p>}
                    <p className="text-[10px] text-[#c2c6d4] font-bold mb-4">{formatDateTime(selectedSos.created_at)}</p>
                    
                    {selectedSos.status === "active" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespond(selectedSos)}
                          className="flex-1 text-[9px] font-black uppercase tracking-widest bg-[#d97706] text-white hover:bg-[#b45309] rounded-xl px-3 py-2.5 transition-all shadow-lg shadow-[#d97706]/20"
                        >
                          Respond
                        </button>
                        <button
                          onClick={() => { setResolveTarget(selectedSos); setSelectedSos(null); }}
                          className="flex-1 text-[9px] font-black uppercase tracking-widest bg-[#16a34a] text-white hover:bg-[#15803d] rounded-xl px-3 py-2.5 transition-all shadow-lg shadow-[#16a34a]/20"
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                    {selectedSos.status === "responding" && (
                      <button
                        onClick={() => { setResolveTarget(selectedSos); setSelectedSos(null); }}
                        className="w-full text-[9px] font-black uppercase tracking-widest bg-[#16a34a] text-white hover:bg-[#15803d] rounded-xl px-3 py-2.5 transition-all shadow-lg shadow-[#16a34a]/20"
                      >
                        Secure Event
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>

        {/* Status Panel */}
        <div className="w-96 p-4 overflow-y-auto space-y-4">
           <Card className="rounded-[2.5rem] border-[#eceef0] shadow-[0_4px_24px_rgba(25,28,30,0.04)] bg-white h-full overflow-hidden flex flex-col">
              <div className="px-8 py-6 border-b border-[#eceef0] flex items-center justify-between bg-[#fcfdfe]">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#727783] mb-1">Event Registry</p>
                    <h3 className="text-lg font-black text-[#191c1e] tracking-tight">{showAll ? "Archive" : "Active Alerts"} ({displayed.length})</h3>
                 </div>
                 {loading && <RefreshCw className="w-4 h-4 text-[#00478d] animate-spin" />}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                 {displayed.length === 0 ? (
                    <div className="text-center py-20">
                       <div className="w-16 h-16 rounded-full bg-[#f0fdf4] flex items-center justify-center mx-auto mb-4 border border-[#dcfce7]">
                          <CheckCircle className="w-8 h-8 text-[#16a34a]" />
                       </div>
                       <p className="text-[#191c1e] font-black leading-tight tracking-tight">System All Green</p>
                       <p className="text-[#727783] text-[10px] font-black uppercase tracking-widest mt-2">Zero active distress signals</p>
                    </div>
                 ) : displayed.map((sos) => (
                    <button
                      key={sos.id}
                      onClick={() => { setSelectedSos(sos); map?.panTo({ lat: sos.lat, lng: sos.lng }); map?.setZoom(17); }}
                      className={cn(
                        "w-full text-left p-5 rounded-2xl border transition-all relative group overflow-hidden shadow-sm",
                        sos.status === "active" 
                          ? "bg-white border-[#fef2f2] hover:border-[#dc2626]/20" 
                          : "bg-[#fcfdfe] border-[#eceef0] hover:border-[#727783]/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                         <div className="flex items-center gap-3">
                            <div className={cn(
                               "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
                               sos.status === "active" ? "bg-[#dc2626] text-white shadow-lg shadow-[#dc2626]/20" : "bg-[#eceef0] text-[#727783]"
                            )}>
                               {sos.userName?.[0]?.toUpperCase() ?? "U"}
                            </div>
                            <p className="font-extrabold text-[#191c1e] text-sm group-hover:text-[#00478d] transition-colors">{sos.userName}</p>
                         </div>
                         <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border",
                            sos.status === "resolved" ? "bg-[#f0fdf4] text-[#16a34a] border-[#dcfce7]" :
                            sos.status === "responding" ? "bg-[#fffbeb] text-[#d97706] border-[#fef3c7]" :
                            "bg-[#fef2f2] text-[#dc2626] border-[#fee2e2] animate-pulse"
                         )}>{sos.status}</Badge>
                      </div>
                      {sos.message && <p className="text-xs text-[#727783] font-medium italic truncate mb-3">"{sos.message}"</p>}
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#c2c6d4]">
                         <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {formatDateTime(sos.created_at)}</span>
                         <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>
                 ))}
              </div>
           </Card>
        </div>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveTarget} onOpenChange={(o) => { if (!o) { setResolveTarget(null); setResolveNote(""); } }}>
        <DialogContent className="rounded-[2.5rem] border-[#eceef0] bg-white shadow-2xl p-10 max-w-lg">
          <DialogHeader className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] flex items-center justify-center text-[#16a34a] mb-6 border border-[#dcfce7]">
               <ShieldAlert className="w-7 h-7" />
            </div>
            <DialogTitle className="text-2xl font-black text-[#191c1e]" style={{ fontFamily: 'var(--font-manrope)' }}>
               Secure Event Vector
            </DialogTitle>
            <DialogDescription className="text-sm text-[#727783] font-medium mt-2">
               Classify this emergency event as secure. The student will be notified that the clinical response is complete.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
             <Label className="text-[10px] font-black uppercase tracking-widest text-[#727783] ml-1">Resolution Intelligence</Label>
             <textarea
               className="w-full rounded-2xl border border-[#eceef0] bg-[#fcfdfe] px-5 py-4 text-sm text-[#191c1e] placeholder:text-[#c2c6d4] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/10 resize-none font-medium leading-relaxed"
               rows={4}
               placeholder="Document clinical outcome, treatments administered, or rescue details..."
               value={resolveNote}
               onChange={(e) => setResolveNote(e.target.value)}
             />
          </div>

          <DialogFooter className="mt-10 gap-3">
            <Button variant="ghost" onClick={() => setResolveTarget(null)} className="rounded-xl font-black uppercase text-[10px] tracking-widest text-[#727783]">Abort Resolve</Button>
            <Button onClick={handleResolve} className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 bg-[#16a34a] hover:bg-[#15803d] text-white shadow-lg shadow-[#16a34a]/20">
               Secure Emergency Alert
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

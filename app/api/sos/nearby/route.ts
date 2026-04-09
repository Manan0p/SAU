import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/** Haversine formula — returns distance in meters between two lat/lng points */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * POST /api/sos/nearby
 * Body: { sosId: string }
 * Returns users within 100m of the SOS location.
 * In a real system this would fan-out notifications to nearby users.
 */
export async function POST(req: NextRequest) {
  try {
    const { sosId } = await req.json() as { sosId: string };
    if (!sosId) return NextResponse.json({ error: "sosId required" }, { status: 400 });

    const adminClient = createAdminClient();

    // Get the SOS request
    const { data: sos } = await adminClient
      .from("sos_requests")
      .select("lat, lng, userId")
      .eq("id", sosId)
      .single();

    if (!sos) return NextResponse.json({ error: "SOS not found" }, { status: 404 });

    // NOTE: In production you'd store user last-known location in a session table.
    // For now we notify all authorized responders (doctor / medical_center / pharmacy).
    const { data: responders } = await adminClient
      .from("profiles")
      .select("id, name, roles")
      .overlaps("roles", ["doctor", "medical_center", "pharmacy", "admin"]);

    // Create a notification for each responder
    if (responders && responders.length > 0) {
      await adminClient.from("notifications").insert(
        responders.map((r) => ({
          userId: r.id,
          type: "sos",
          title: "🚨 SOS Alert Nearby",
          message: `Emergency alert triggered. SOS ID: ${sosId}`,
          relatedId: sosId,
        }))
      );
    }

    return NextResponse.json({
      notified: responders?.length ?? 0,
      message: `Notified ${responders?.length ?? 0} responders`,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

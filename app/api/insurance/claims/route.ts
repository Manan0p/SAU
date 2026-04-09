import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * PATCH /api/insurance/claims
 * Insurance role reviews a claim (approve / reject)
 */
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const adminClient = createAdminClient();

    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["insurance", "admin"];
    if (!callerProfile?.roles?.some((r: string) => allowedRoles.includes(r))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { claimId, status, reviewNote, approvedAmount } = await req.json();
    if (!claimId || !status) {
      return NextResponse.json({ error: "claimId and status required" }, { status: 400 });
    }

    const { data: claim } = await adminClient
      .from("claims")
      .select("userId, amount, description")
      .eq("id", claimId)
      .single();

    const { error: updateErr } = await adminClient.from("claims").update({
      status,
      reviewedBy: user.id,
      reviewNote: reviewNote ?? null,
      approvedAmount: status === "approved" ? (approvedAmount ?? claim?.amount) : null,
      updatedAt: new Date().toISOString(),
    }).eq("id", claimId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Notify the student
    if (claim) {
      await adminClient.from("notifications").insert([{
        userId: claim.userId,
        type: "insurance",
        title: status === "approved" ? "✅ Claim Approved" : "❌ Claim Rejected",
        message: status === "approved"
          ? `Your claim of ₹${approvedAmount ?? claim.amount} has been approved. ${reviewNote ?? ""}`
          : `Your claim was rejected. Reason: ${reviewNote ?? "No reason provided."}`,
        relatedId: claimId,
      }]);
    }

    // Audit log
    await adminClient.from("audit_logs").insert([{
      actorId: user.id,
      action: "claim_reviewed",
      target: "claims",
      targetId: claimId,
      details: { status, reviewNote, approvedAmount },
    }]);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

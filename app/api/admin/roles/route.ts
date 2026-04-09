import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import type { UserRole } from "@/types";

/**
 * PATCH /api/admin/roles
 * Body: { targetUserId: string, roles: UserRole[] }
 * Requires caller to be an admin (validated via Supabase JWT)
 */
export async function PATCH(req: NextRequest) {
  try {
    // Validate caller identity via Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const adminClient = createAdminClient();

    // Verify the JWT and get caller's profile
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("roles")
      .eq("id", user.id)
      .single();

    if (!callerProfile?.roles?.includes("admin")) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, roles } = body as { targetUserId: string; roles: UserRole[] };

    if (!targetUserId || !Array.isArray(roles)) {
      return NextResponse.json({ error: "targetUserId and roles are required" }, { status: 400 });
    }

    // Update target user's roles
    const { error: updateErr } = await adminClient
      .from("profiles")
      .update({ roles, updated_at: new Date().toISOString() })
      .eq("id", targetUserId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Write audit log
    await adminClient.from("audit_logs").insert([{
      actorId: user.id,
      action: "role_change",
      target: "profiles",
      targetId: targetUserId,
      details: { newRoles: roles },
    }]);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/**
 * GET /api/admin/roles
 * Returns all users with their roles for admin management
 */
export async function GET(req: NextRequest) {
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

    if (!callerProfile?.roles?.includes("admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: users } = await adminClient
      .from("profiles")
      .select("id, name, email, roles, college_id, created_at")
      .order("created_at", { ascending: false });

    return NextResponse.json({ users });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

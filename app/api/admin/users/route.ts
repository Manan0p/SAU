import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const adminClient = createAdminClient();

    // Verify JWT & Admin role
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
    const { email, password, name, role, college_id } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: createdUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        college_id: college_id || undefined,
      }
    });

    if (createErr || !createdUser.user) {
      return NextResponse.json({ error: createErr?.message || "Failed to create user" }, { status: 500 });
    }

    // Write audit log
    await adminClient.from("audit_logs").insert([{
      actorId: user.id,
      action: "user_created",
      target: "profiles",
      targetId: createdUser.user.id,
      details: { email, role },
    }]);

    return NextResponse.json({ success: true, user: createdUser.user });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

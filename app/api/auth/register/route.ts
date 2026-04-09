import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, college_id } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, college_id: college_id ?? "" },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Wait for trigger, then upsert profile with student role
    await new Promise((r) => setTimeout(r, 1500));

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: authData.user.id,
        name,
        email,
        college_id: college_id ?? "",
        roles: ["student"],
      });

    if (profileError) {
      console.error("Profile upsert error:", profileError.message);
    }

    return NextResponse.json({ success: true, userId: authData.user.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

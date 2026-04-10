import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import type { UserRole } from "@/types";

type AdminUserView = {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  college_id?: string;
  created_at?: string;
};

async function fetchProfilesWithSchemaFallback(adminClient: ReturnType<typeof createAdminClient>) {
  const attempts = [
    {
      label: "snake_case timestamp",
      query: () =>
        adminClient
          .from("profiles")
          .select("id, name, email, roles, college_id, created_at")
          .order("created_at", { ascending: false }),
    },
    {
      label: "camelCase timestamp",
      query: () =>
        adminClient
          .from("profiles")
          .select("id, name, email, roles, college_id, createdAt")
          .order("createdAt", { ascending: false }),
    },
    {
      label: "no timestamp",
      query: () =>
        adminClient
          .from("profiles")
          .select("id, name, email, roles, college_id"),
    },
  ] as const;

  let lastError: string | null = null;

  for (const attempt of attempts) {
    const { data, error } = await attempt.query();
    if (!error) {
      const normalized = ((data ?? []) as Array<Record<string, unknown>>).map((u) => ({
        id: String(u.id ?? ""),
        name: String(u.name ?? u.email ?? "Unknown User"),
        email: String(u.email ?? ""),
        roles: normalizeRoles(u.roles),
        college_id: typeof u.college_id === "string" ? u.college_id : undefined,
        created_at:
          typeof u.created_at === "string"
            ? u.created_at
            : typeof u.createdAt === "string"
              ? u.createdAt
              : undefined,
      }));

      return { users: normalized, mode: attempt.label, error: null };
    }

    lastError = error.message;

    const isMissingColumn = /column .* does not exist/i.test(error.message);
    if (!isMissingColumn) {
      return { users: null, mode: attempt.label, error: error.message };
    }
  }

  return { users: null, mode: "all_failed", error: lastError };
}

function normalizeRoles(rawRoles: unknown): UserRole[] {
  if (Array.isArray(rawRoles)) {
    return rawRoles.filter((r): r is UserRole => typeof r === "string") as UserRole[];
  }
  if (typeof rawRoles === "string") {
    return [rawRoles as UserRole];
  }
  return [];
}

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

    const profilesResult = await fetchProfilesWithSchemaFallback(adminClient);

    if (profilesResult.error) {
      return NextResponse.json(
        {
          error: `Could not read profiles: ${profilesResult.error}. Verify Supabase URL/service key and table access.`,
        },
        { status: 500 }
      );
    }

    const users = profilesResult.users ?? [];

    if (!users || users.length === 0) {
      const { data: authUsersData, error: authUsersErr } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 500,
      });

      if (authUsersErr) {
        return NextResponse.json(
          {
            error: `No profiles found and fallback auth lookup failed: ${authUsersErr.message}`,
          },
          { status: 500 }
        );
      }

      const fallbackUsers: AdminUserView[] = (authUsersData?.users ?? []).map((u) => {
        const userRole = u.user_metadata?.role;
        const appRoles = u.app_metadata?.roles;
        const roles = normalizeRoles(appRoles).length > 0 ? normalizeRoles(appRoles) : normalizeRoles(userRole);

        return {
          id: u.id,
          name: (u.user_metadata?.name as string | undefined) ?? u.email ?? "Unknown User",
          email: u.email ?? "",
          roles,
          college_id: (u.user_metadata?.college_id as string | undefined) ?? undefined,
          created_at: u.created_at,
        };
      });

      return NextResponse.json({
        users: fallbackUsers,
        warning:
          "Profiles table returned no rows. Showing Auth users fallback. Check profile trigger/seed for full registry data.",
      });
    }

    return NextResponse.json({
      users,
      warning:
        profilesResult.mode !== "snake_case timestamp"
          ? "Profiles schema differs from expected defaults. Data loaded using compatibility mode."
          : undefined,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

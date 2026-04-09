"use client";

import { useEffect, useState, useCallback } from "react";
import { UserCog, Users, ShieldCheck, Activity, FileText, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ToastProvider";
import { formatDate } from "@/lib/utils";
import type { UserRole } from "@/types";

const ALL_ROLES: UserRole[] = ["student", "doctor", "pharmacy", "admin", "insurance", "medical_center"];

interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  college_id?: string;
  created_at: string;
  editingRoles?: UserRole[];
  saving?: boolean;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "audit">("users");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    const [usersRes, logsRes] = await Promise.all([
      fetch("/api/admin/roles", { headers: { Authorization: `Bearer ${token}` } }),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    const usersJson = await usersRes.json();
    if (usersJson.users) setUsers(usersJson.users.map((u: AdminUser) => ({ ...u, editingRoles: [...u.roles] })));
    if (logsRes.data) setAuditLogs(logsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRole = (userId: string, role: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const has = u.editingRoles?.includes(role);
        return { ...u, editingRoles: has ? u.editingRoles?.filter((r) => r !== role) : [...(u.editingRoles ?? []), role] };
      })
    );
  };

  const saveRoles = async (targetUser: AdminUser) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, saving: true } : u)));
    const res = await fetch("/api/admin/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUserId: targetUser.id, roles: targetUser.editingRoles }),
    });
    const json = await res.json();
    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, saving: false } : u)));
    if (json.success) { toast({ title: "Roles updated ✓", variant: "success" }); load(); }
    else toast({ title: "Error", description: json.error, variant: "destructive" });
  };

  const ROLE_COLORS: Record<UserRole, string> = {
    student: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    doctor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    pharmacy: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    admin: "bg-red-500/20 text-red-400 border-red-500/30",
    insurance: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    medical_center: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <UserCog className="w-8 h-8 text-rose-400" /> Admin Control Panel
        </h1>
        <p className="text-slate-400">Manage users, roles, and system activity · Welcome, {user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: users.length, icon: Users, color: "text-blue-400", border: "border-blue-500/20" },
          { label: "Doctors", value: users.filter((u) => u.roles.includes("doctor")).length, icon: Activity, color: "text-emerald-400", border: "border-emerald-500/20" },
          { label: "Admins", value: users.filter((u) => u.roles.includes("admin")).length, icon: ShieldCheck, color: "text-red-400", border: "border-red-500/20" },
          { label: "Audit Events", value: auditLogs.length, icon: FileText, color: "text-amber-400", border: "border-amber-500/20" },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <Card key={label} className={`border ${border}`}>
            <CardContent className="p-5">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["users", "audit"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-slate-400 hover:text-white border border-transparent hover:border-white/10"
            }`}
          >
            {t === "users" ? "User Management" : "Audit Logs"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : tab === "users" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>College ID</TableHead>
                  <TableHead>Current Roles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Edit Roles</TableHead>
                  <TableHead>Save</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const changed = JSON.stringify(u.roles.slice().sort()) !== JSON.stringify((u.editingRoles ?? []).slice().sort());
                  return (
                    <TableRow key={u.id} className={u.id === user?.id ? "bg-rose-500/5" : ""}>
                      <TableCell>
                        <p className="font-medium text-sm text-white">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">{u.college_id ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(u.roles ?? []).map((r) => (
                            <span key={r} className={`text-xs px-1.5 py-0.5 rounded-md border ${ROLE_COLORS[r]}`}>{r}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{formatDate(u.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {ALL_ROLES.map((role) => (
                            <button
                              key={role}
                              onClick={() => toggleRole(u.id, role)}
                              disabled={u.id === user?.id && role === "admin"}
                              className={`text-xs px-2 py-1 rounded-md border transition-all ${
                                (u.editingRoles ?? []).includes(role) ? ROLE_COLORS[role] : "border-white/10 text-slate-600 hover:border-white/20 hover:text-slate-400"
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => saveRoles(u)} disabled={!changed || u.saving} className="gap-1 text-xs">
                          {u.saving ? "…" : <><Save className="w-3 h-3" /> Save</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {auditLogs.length === 0 ? (
              <div className="py-16 text-center">
                <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No audit events yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: Record<string, unknown>) => (
                    <TableRow key={String(log.id)}>
                      <TableCell className="text-xs text-slate-400">{formatDate(String(log.created_at))}</TableCell>
                      <TableCell><Badge className="text-xs">{String(log.action)}</Badge></TableCell>
                      <TableCell className="text-xs text-slate-300">{String(log.target ?? "—")}</TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono max-w-[200px] truncate">{JSON.stringify(log.details)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

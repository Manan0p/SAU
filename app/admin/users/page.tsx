"use client";

import { useEffect, useState } from "react";
import { Users, Search, UserCog, RefreshCw, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type UserRole = "student" | "doctor" | "pharmacy" | "admin" | "insurance" | "medical_center";

const ROLE_COLORS: Record<UserRole, string> = {
  student:        "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
  doctor:         "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  pharmacy:       "bg-violet-500/20 text-violet-400 border-violet-500/30",
  admin:          "bg-red-500/20 text-red-400 border-red-500/30",
  insurance:      "bg-amber-500/20 text-amber-400 border-amber-500/30",
  medical_center: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

interface Profile {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  college_id?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,name,email,roles,college_id")
      .order("name", { ascending: true });
    setUsers((data ?? []) as Profile[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.college_id?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    students: users.filter((u) => u.roles?.includes("student")).length,
    staff: users.filter((u) => !u.roles?.includes("student") && !u.roles?.includes("admin")).length,
    admins: users.filter((u) => u.roles?.includes("admin")).length,
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <UserCog className="w-8 h-8 text-violet-400" />
            User Management
          </h1>
          <p className="text-slate-400">View and manage all platform users</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users",   value: stats.total,    color: "text-violet-400",  border: "border-violet-500/20" },
          { label: "Students",      value: stats.students, color: "text-fuchsia-400", border: "border-fuchsia-500/20" },
          { label: "Staff Members", value: stats.staff,    color: "text-emerald-400", border: "border-emerald-500/20" },
          { label: "Admins",        value: stats.admins,   color: "text-red-400",     border: "border-red-500/20" },
        ].map(({ label, value, color, border }) => (
          <Card key={label} className={`border ${border}`}>
            <CardContent className="p-5">
              <p className={`text-2xl font-bold ${color}`}>{loading ? "—" : value}</p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input
          placeholder="Search by name, email, ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* User List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {u.name?.slice(0, 2).toUpperCase() ?? "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    {u.college_id && (
                      <p className="text-xs text-slate-600 font-mono">{u.college_id}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end shrink-0">
                    {(u.roles ?? []).map((r) => (
                      <span key={r} className={`text-xs px-1.5 py-0.5 rounded border ${ROLE_COLORS[r] ?? "bg-white/5 text-slate-400 border-white/10"}`}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-700 text-center pt-2">
        Role editing coming soon — use Supabase Dashboard to modify roles manually
      </p>
    </div>
  );
}

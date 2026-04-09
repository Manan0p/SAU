"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Map, Activity,
  LogOut, Heart, ShieldAlert,
  CalendarDays, Pill, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { cn, getInitials } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Control Panel" },
  { href: "/admin/dashboard", icon: Users, label: "User Management" },
  { href: "/appointments", icon: CalendarDays, label: "All Appointments" },
  { href: "/insurance-admin", icon: ShieldCheck, label: "Claims Review" },
  { href: "/pharmacy", icon: Pill, label: "Pharmacy" },
  { href: "/medical-records", icon: FileText, label: "Medical Records" },
  { href: "/sos/map", icon: Map, label: "SOS Map" },
  { href: "/admin/dashboard", icon: Activity, label: "Audit Logs" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-950/95 border-r border-white/5 flex flex-col z-40 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-base leading-tight">UniWell</p>
          <p className="text-xs text-rose-400 font-semibold">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-rose-400" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Admin badge + logout */}
      <div className="px-4 pb-6 border-t border-white/5 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user ? getInitials(user.name) : "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-rose-400 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Administrator
            </p>
          </div>
          {user && <NotificationBell userId={user.id} />}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, Map, Activity,
  LogOut, Heart, ShieldAlert,
  Pill, ShieldCheck, FileClock, User, UserPlus, Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { cn, getInitials } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/dashboard",  icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users",      icon: Users,           label: "User Management" },
  { href: "/admin/users/create", icon: UserPlus,      label: "Provision User" },
  { href: "/admin/leave",      icon: FileClock,       label: "Leave Review" },
  { href: "/admin/audit",      icon: Activity,        label: "Audit Logs" },
  { href: "/insurance-admin",  icon: ShieldCheck,     label: "Claims Review" },
  { href: "/staff/pharmacy",   icon: Pill,            label: "Pharmacy" },
  { href: "/medical-records",  icon: FileText,        label: "Medical Records" },
  { href: "/sos/map",          icon: Map,             label: "SOS Map" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.name
    ? getInitials(user.name)
    : "??";

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40"
      style={{
        background: "rgba(247,249,251,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(194,198,212,0.15)",
      }}
    >
      {/* ── Logo ─────────────────────────── */}
      <div className="px-6 py-6 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
        >
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <span
            className="text-lg font-extrabold leading-none tracking-tight"
            style={{ fontFamily: "var(--font-manrope)", color: "#191c1e" }}
          >
            UniWell
          </span>
          <p className="text-[11px] font-bold text-[#005eb8] uppercase tracking-wider mt-0.5 opacity-80">
            Admin Portal
          </p>
        </div>
      </div>

      {/* ── Navigation ───────────────────── */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          // Identify if this is the best matching link for the current path
          const isActive = pathname === href || (
            // For nested routes, only match if it's the longest matching parent
            pathname.startsWith(href + "/") && 
            !NAV_ITEMS.some(item => 
              item.href !== href && 
              item.href.length > href.length && 
              (pathname === item.href || pathname.startsWith(item.href + "/"))
            )
          );
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-white shadow-[0_4px_12px_rgba(0,71,141,0.2)]"
                  : "text-[#424752] hover:text-[#191c1e] hover:bg-[#eceef0]"
              )}
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, #00478d, #005eb8)",
                    }
                  : {}
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom Section ──────────────── */}
      <div
        className="px-4 py-4 space-y-1"
        style={{ borderTop: "1px solid rgba(194,198,212,0.2)" }}
      >
        {/* Notifications */}
        <NotificationBell userId={user?.id ?? ""} variant="row" />

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group",
            (pathname === "/settings" || (pathname.startsWith("/settings") && pathname !== "/settings/profile" && pathname !== "/settings/security"))
              ? "bg-[#eceef0] text-[#191c1e]" 
              : "text-[#727783] hover:bg-[#eceef0] hover:text-[#191c1e]"
          )}
        >
          <div className={cn("w-8 h-8 flex items-center justify-center shrink-0 rounded-lg transition-colors", (pathname === "/settings" || (pathname.startsWith("/settings") && pathname !== "/settings/profile")) ? "bg-[#00478d]/10" : "group-hover:bg-[#00478d]/10")}>
            <Settings className={cn("w-4 h-4 shrink-0 transition-transform group-hover:rotate-45", (pathname === "/settings" || (pathname.startsWith("/settings") && pathname !== "/settings/profile")) ? "text-[#00478d]" : "")} />
          </div>
          <span className="text-sm font-medium">Settings</span>
        </Link>

        {/* Profile */}
        <Link
          href="/settings/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group",
            pathname === "/settings/profile" ? "bg-[#eceef0]" : "hover:bg-[#eceef0]"
          )}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #424752, #191c1e)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold truncate leading-none"
              style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}
            >
              {user?.name ?? "Admin"}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-[#727783] flex items-center gap-1">
              <ShieldAlert className="w-2.5 h-2.5" /> Administrator
            </p>
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#ffdad6] group text-[#727783] hover:text-[#ba1a1a]"
        >
          <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-lg group-hover:bg-[#ba1a1a]/10">
            <LogOut className="w-4 h-4 shrink-0" />
          </div>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

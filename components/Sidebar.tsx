"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Bell,
  LogOut,
  Heart,
  Pill,
  AlertTriangle,
  UserCircle,
  Stethoscope,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ToastProvider";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/student/dashboard" },
  { label: "Appointments", icon: CalendarDays, href: "/student/appointments" },
  { label: "Insurance", icon: FileText, href: "/student/insurance" },
  { label: "Medical Records", icon: Stethoscope, href: "/student/medical-records" },
  { label: "Reminders", icon: Pill, href: "/student/reminders" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({ title: "Signed out", description: "See you soon!", variant: "success" });
    router.push("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
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
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
        >
          <Heart className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <span
            className="text-base font-bold leading-none"
            style={{ fontFamily: "var(--font-manrope)", color: "#191c1e" }}
          >
            UniWell
          </span>
          <p className="text-[10px] leading-none mt-0.5" style={{ color: "#727783" }}>
            Campus Health Portal
          </p>
        </div>
      </div>

      {/* ── Navigation ───────────────────── */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href || (
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

        {/* SOS — always red */}
        <Link
          href="/student/sos"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            pathname === "/student/sos"
              ? "bg-[#ba1a1a] text-white"
              : "text-[#ba1a1a] hover:bg-[#ffdad6]"
          )}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Emergency SOS
        </Link>
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

        {/* User profile */}
        <Link
          href="/settings/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group",
            pathname === "/settings/profile" ? "bg-[#eceef0]" : "hover:bg-[#eceef0]"
          )}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #4a6078, #00478d)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate leading-none"
              style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}
            >
              {user?.name ?? "Student"}
            </p>
            <p className="text-[10px] truncate mt-1 font-medium" style={{ color: "#727783" }}>
              {user?.email ?? ""}
            </p>
          </div>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[#ffdad6] group"
          style={{ color: "#727783" }}
        >
          <div className="w-8 h-8 flex items-center justify-center shrink-0 rounded-lg group-hover:bg-[#ba1a1a]/10">
            <LogOut className="w-4 h-4 shrink-0 group-hover:text-[#ba1a1a]" />
          </div>
          <span className="group-hover:text-[#ba1a1a]">Sign out</span>
        </button>
      </div>
    </aside>
  );
}

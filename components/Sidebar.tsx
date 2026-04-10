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
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "text-white"
                  : "text-[#424752] hover:text-[#191c1e] hover:bg-[#eceef0]"
              )}
              style={
                active
                  ? {
                      background: "linear-gradient(135deg, #00478d, #005eb8)",
                      boxShadow: "0 4px 12px rgba(0,94,184,0.25)",
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
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <NotificationBell userId={user?.id ?? ""} />
          <span className="text-sm font-medium" style={{ color: "#424752" }}>Notifications</span>
        </div>

        {/* User profile */}
        <Link
          href="/student/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#eceef0] transition-colors group"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
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
            <p className="text-xs truncate mt-0.5" style={{ color: "#727783" }}>
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
          <LogOut className="w-4 h-4 shrink-0 group-hover:text-[#ba1a1a]" />
          <span className="group-hover:text-[#ba1a1a]">Sign out</span>
        </button>
      </div>
    </aside>
  );
}

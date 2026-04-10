"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays, FileSearch, Pill, ShieldCheck, Map,
  LogOut, Heart, User, Package, LayoutDashboard, Stethoscope, Activity, Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { cn, getInitials } from "@/lib/utils";
import type { UserRole } from "@/types";

// Role to nav items mapping
const ROLE_NAV: Record<UserRole, { href: string; icon: React.ElementType; label: string }[]> = {
  doctor: [
    { href: "/staff/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/staff/appointments", icon: CalendarDays, label: "My Appointments" },
    { href: "/medical-records", icon: Stethoscope,   label: "Patient Records" },
    { href: "/sos/map",         icon: Map,          label: "SOS Map" },
  ],
  pharmacy: [
    { href: "/staff/pharmacy", icon: Pill, label: "Pharmacy Center" },
    { href: "/staff/pharmacy/prescriptions", icon: FileSearch, label: "Prescriptions" },
  ],
  insurance: [
    { href: "/insurance-admin",  icon: ShieldCheck, label: "Claims Review" },
  ],
  medical_center: [
    { href: "/sos/map",         icon: Map,        label: "SOS Map" },
  ],
  student: [],
  admin: [],
};

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  doctor: "Doctor / M.O.",
  pharmacy: "Pharmacist",
  insurance: "Insurance Admin",
  medical_center: "Clinical Staff",
};

const STAFF_ROLES: UserRole[] = ["doctor", "pharmacy", "insurance", "medical_center"];

export default function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Find primary staff role
  const primaryRole = STAFF_ROLES.find((r) => hasRole(r)) ?? "doctor";
  const navItems = ROLE_NAV[primaryRole] ?? [];
  const roleLabel = ROLE_LABEL[primaryRole] ?? "Clinical Staff";

  const initials = user?.name ? getInitials(user.name) : "??";

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
          style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
        >
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <span
            className="text-lg font-extrabold leading-none tracking-tight"
            style={{ fontFamily: "var(--font-manrope)", color: "#191c1e" }}
          >
            UniWell
          </span>
          <p className="text-[11px] font-bold text-[#0369a1] uppercase tracking-wider mt-0.5 opacity-80">
            {roleLabel}
          </p>
        </div>
      </div>

      {/* ── Navigation ───────────────────── */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = pathname === href || (href !== "/staff/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "text-white shadow-[0_4px_12px_rgba(2,132,199,0.2)]"
                  : "text-[#424752] hover:text-[#191c1e] hover:bg-[#eceef0]"
              )}
              style={
                active
                  ? {
                      background: "linear-gradient(135deg, #0284c7, #0369a1)",
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
        {/* Profile */}
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group",
            pathname === "/profile" ? "bg-[#eceef0]" : "hover:bg-[#eceef0]"
          )}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #0369a1, #0c4a6e)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-bold truncate leading-none"
              style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}
            >
              {user?.name ?? "Staff Member"}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 text-[#727783] flex items-center gap-1">
              {roleLabel}
            </p>
          </div>
          {user && <NotificationBell userId={user.id} />}
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-[#ffdad6] group text-[#727783] hover:text-[#ba1a1a]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

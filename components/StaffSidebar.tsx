"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays, FileSearch, Pill, ShieldCheck, Map,
  LogOut, Heart, User, ClipboardList, Package,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { cn, getInitials } from "@/lib/utils";
import type { UserRole } from "@/types";

// Role to nav items mapping
const ROLE_NAV: Record<UserRole, { href: string; icon: React.ElementType; label: string }[]> = {
  doctor: [
    { href: "/staff/dashboard", icon: CalendarDays, label: "My Appointments" },
    { href: "/medical-records", icon: FileSearch, label: "Medical Records" },
    { href: "/sos/map", icon: Map, label: "SOS Map" },
  ],
  pharmacy: [
    { href: "/staff/dashboard", icon: Package, label: "Dashboard" },
    { href: "/pharmacy", icon: Pill, label: "Inventory" },
    { href: "/staff/prescriptions", icon: ClipboardList, label: "Prescriptions" },
  ],
  insurance: [
    { href: "/staff/dashboard", icon: ShieldCheck, label: "Dashboard" },
    { href: "/insurance-admin", icon: ShieldCheck, label: "Claims Review" },
  ],
  medical_center: [
    { href: "/staff/dashboard", icon: Map, label: "Dashboard" },
    { href: "/sos/map", icon: Map, label: "SOS Map" },
    { href: "/medical-records", icon: FileSearch, label: "Medical Records" },
  ],
  // These won't appear in staff sidebar but are needed for type completeness
  student: [],
  admin: [],
};

const ROLE_COLORS: Partial<Record<UserRole, string>> = {
  doctor: "from-blue-500 to-cyan-600",
  pharmacy: "from-emerald-500 to-teal-600",
  insurance: "from-amber-500 to-orange-600",
  medical_center: "from-violet-500 to-purple-600",
};

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  doctor: "Doctor",
  pharmacy: "Pharmacist",
  insurance: "Insurance Officer",
  medical_center: "Medical Center",
};

const STAFF_ROLES: UserRole[] = ["doctor", "pharmacy", "insurance", "medical_center"];

export default function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/staff/login");
  };

  // Find primary staff role
  const primaryRole = STAFF_ROLES.find((r) => hasRole(r)) ?? "doctor";
  const navItems = ROLE_NAV[primaryRole] ?? [];
  const gradientColor = ROLE_COLORS[primaryRole] ?? "from-blue-500 to-cyan-600";
  const roleLabel = ROLE_LABEL[primaryRole] ?? "Staff";

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-950/95 border-r border-white/5 flex flex-col z-40 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg`}>
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-base leading-tight">UniWell</p>
          <p className="text-xs text-blue-400 font-semibold">{roleLabel} Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-blue-400" : "")} />
              {label}
            </Link>
          );
        })}
        {/* Profile link always visible */}
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
            pathname === "/profile"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <User className={cn("w-4 h-4 shrink-0", pathname === "/profile" ? "text-blue-400" : "")} />
          My Profile
        </Link>
      </nav>

      {/* User + Logout */}
      <div className="px-4 pb-6 border-t border-white/5 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {user ? getInitials(user.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate capitalize">{roleLabel}</p>
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

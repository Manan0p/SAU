"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  AlertTriangle,
  LogOut,
  Heart,
  FileSearch,
  Pill,
  User,
  FileClock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";
import { cn, getInitials } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/student/dashboard",       icon: LayoutDashboard, label: "Dashboard" },
  { href: "/student/appointments",    icon: CalendarDays,    label: "Appointments" },
  { href: "/student/medical-records", icon: FileSearch,      label: "Medical Records" },
  { href: "/student/insurance",       icon: FileText,        label: "Insurance Claims" },
  { href: "/student/pharmacy",        icon: Pill,            label: "Medicines" },
  { href: "/student/leave",           icon: FileClock,       label: "Medical Leave" },
  { href: "/student/profile",         icon: User,            label: "My Profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const visibleItems = NAV_ITEMS;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-950/95 border-r border-white/5 flex flex-col z-40 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-base leading-tight">UniWell</p>
          <p className="text-xs text-slate-500">Campus Health</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-violet-400" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* SOS Emergency Button */}
      <div className="px-4 pb-3">
        <Link
          href="/student/sos"
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-sm font-medium transition-all duration-200 group"
        >
          <AlertTriangle className="w-4 h-4 group-hover:animate-pulse" />
          Emergency SOS
        </Link>
      </div>

      {/* User + Notifications + Logout */}
      <div className="px-4 pb-6 border-t border-white/5 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user ? getInitials(user.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">
              {user?.roles?.join(", ")}
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

"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  ArrowRight,
  Heart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { useClaims } from "@/hooks/useClaims";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { upcoming, past, refresh: refreshAppt } = useAppointments(userId);
  const { claims, pending, totalPending, totalApproved, refresh: refreshClaims } = useClaims(userId);

  useEffect(() => {
    refreshAppt();
    refreshClaims();
  }, [refreshAppt, refreshClaims]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    {
      label: "Upcoming Appointments",
      value: upcoming.length,
      icon: CalendarDays,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      href: "/appointments",
    },
    {
      label: "Pending Claims",
      value: pending.length,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      href: "/insurance",
    },
    {
      label: "Amount Pending",
      value: formatCurrency(totalPending),
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      href: "/insurance",
    },
    {
      label: "Claims Approved",
      value: formatCurrency(totalApproved),
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      href: "/insurance",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* ── Header ────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {greeting}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-400">
            Student ID: <span className="text-slate-300 font-mono">{user?.studentId}</span> ·{" "}
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <Link href="/sos">
          <Button variant="destructive" size="lg" className="gap-2 animate-pulse shadow-lg shadow-red-500/20">
            <AlertTriangle className="w-4 h-4" />
            SOS Emergency
          </Button>
        </Link>
      </div>

      {/* ── Stats Grid ────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, border, href }) => (
          <Link key={label} href={href}>
            <Card className={`border ${border} hover:border-white/20 transition-all duration-200 cursor-pointer group hover:scale-[1.02]`}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-2xl font-bold text-white mb-1">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Quick Actions ──────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/appointments">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-all duration-200 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Book Appointment</p>
                <p className="text-xs text-slate-400">See available doctors</p>
              </div>
              <ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/insurance">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-200 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">File a Claim</p>
                <p className="text-xs text-slate-400">Submit insurance claim</p>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/sos">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all duration-200 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Emergency SOS</p>
                <p className="text-xs text-slate-400">Alert campus health team</p>
              </div>
              <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── Bottom Row ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                Upcoming Appointments
              </CardTitle>
              <Link href="/appointments">
                <Button variant="ghost" size="sm" className="text-xs">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No upcoming appointments</p>
                <Link href="/appointments">
                  <Button variant="outline" size="sm" className="mt-3">Book one now</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 3).map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">
                      {getInitials(appt.doctorName.replace("Dr. ", ""))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{appt.doctorName}</p>
                      <p className="text-xs text-slate-400">{appt.specialty} · {formatDate(appt.timeSlot)}</p>
                    </div>
                    <Badge variant="default">Booked</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Claims */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                Recent Claims
              </CardTitle>
              <Link href="/insurance">
                <Button variant="ghost" size="sm" className="text-xs">View all</Button>
              </Link>
            </div>
            <CardDescription>Your insurance claim status</CardDescription>
          </CardHeader>
          <CardContent>
            {claims.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No claims filed yet</p>
                <Link href="/insurance">
                  <Button variant="outline" size="sm" className="mt-3">File a claim</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.slice(0, 3).map((claim) => (
                  <div key={claim.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{claim.description}</p>
                      <p className="text-xs text-slate-400">{formatDate(claim.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-white">{formatCurrency(claim.amount)}</p>
                      <Badge
                        variant={
                          claim.status === "approved"
                            ? "success"
                            : claim.status === "rejected"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {claim.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

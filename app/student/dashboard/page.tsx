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
  ArrowRight,
  Heart,
  Zap,
  Activity,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { useClaims } from "@/hooks/useClaims";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { upcoming, refresh: refreshAppt } = useAppointments(userId);
  const { claims, pending, totalPending, totalApproved, refresh: refreshClaims } = useClaims(userId);

  useEffect(() => {
    refreshAppt();
    refreshClaims();
  }, [refreshAppt, refreshClaims]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen" style={{ background: "#f7f9fb" }}>
      {/* ── Hero Header ───────────────────────────────────────────── */}
      <div
        className="px-10 pt-10 pb-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f2f4f6 100%)",
          borderBottom: "1px solid #e0e3e5"
        }}
      >
        {/* ambient blobs */}
        <div className="absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #cae2fe, transparent)" }} />
        <div className="absolute bottom-[-40px] left-40 w-48 h-48 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #d6e3ff, transparent)" }} />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "#4a6078", fontFamily: "var(--font-public-sans)" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1
              className="text-4xl font-bold mb-2 leading-tight"
              style={{ fontFamily: "var(--font-manrope)", color: "#191c1e" }}
            >
              {greeting},<br />
              <span style={{ color: "#00478d" }}>{user?.name?.split(" ")[0] ?? "Student"} 👋</span>
            </h1>
            <p
              className="text-sm font-medium"
              style={{ color: "#727783", fontFamily: "var(--font-public-sans)" }}
            >
              Student ID:{" "}
              <span className="font-mono font-bold text-[#191c1e]">{user?.studentId ?? "—"}</span>
            </p>

            {/* Health status chip */}
            <div
              className="inline-flex items-center gap-2 mt-5 px-3.5 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "#d6e3ff", color: "#00478d" }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Cleared for Campus
            </div>
          </div>

          {/* SOS button — stays red */}
          <Link href="/student/sos">
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #ba1a1a, #e63939)",
                boxShadow: "0 4px 16px rgba(186,26,26,0.25)",
              }}
            >
              <AlertTriangle className="w-4 h-4" />
              SOS Emergency
            </button>
          </Link>
        </div>

        {/* ── Stat Row ──────────────────────── */}
        <div className="relative mt-8 grid grid-cols-4 gap-4">
          {[
            { label: "Upcoming Appts", value: upcoming.length, icon: CalendarDays, href: "/student/appointments" },
            { label: "Pending Claims", value: pending.length, icon: Clock, href: "/student/insurance" },
            { label: "Pending Amount", value: formatCurrency(totalPending), icon: TrendingUp, href: "/student/insurance" },
            { label: "Approved", value: formatCurrency(totalApproved), icon: CheckCircle, href: "/student/insurance" },
          ].map(({ label, value, icon: Icon, href }) => (
            <Link key={label} href={href}>
              <div
                className="rounded-2xl p-4 cursor-pointer group transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 2px 12px rgba(25,28,30,0.04)",
                  border: "1px solid #eceef0",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "#f2f4f6" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#005eb8" }} />
                </div>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-manrope)", color: "#191c1e" }}>
                  {value}
                </p>
                <p className="text-xs mt-1 font-semibold uppercase tracking-wider text-[#727783]">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="px-10 py-8 space-y-8">

        {/* Quick Actions */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4" style={{ color: "#00478d" }} />
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: "#00478d", fontFamily: "var(--font-public-sans)" }}
            >
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Link href="/student/appointments">
              <div
                className="rounded-2xl p-5 cursor-pointer group transition-all duration-200 hover:scale-[1.01]"
                style={{ background: "#ffffff", boxShadow: "0 2px 12px rgba(25,28,30,0.06)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#d6e3ff" }}
                >
                  <CalendarDays className="w-5 h-5" style={{ color: "#00478d" }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}>Book Appointment</p>
                <p className="text-xs mt-1" style={{ color: "#727783" }}>See available campus doctors</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: "#00478d" }}>
                  Schedule now <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/student/insurance">
              <div
                className="rounded-2xl p-5 cursor-pointer group transition-all duration-200 hover:scale-[1.01]"
                style={{ background: "#ffffff", boxShadow: "0 2px 12px rgba(25,28,30,0.06)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#cae2fe" }}
                >
                  <Shield className="w-5 h-5" style={{ color: "#4a6078" }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}>File Insurance Claim</p>
                <p className="text-xs mt-1" style={{ color: "#727783" }}>Submit and track claims easily</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: "#4a6078" }}>
                  File claim <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/student/reminders">
              <div
                className="rounded-2xl p-5 cursor-pointer group transition-all duration-200 hover:scale-[1.01]"
                style={{ background: "#ffffff", boxShadow: "0 2px 12px rgba(25,28,30,0.06)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#ffdbcb" }}
                >
                  <Activity className="w-5 h-5" style={{ color: "#793100" }} />
                </div>
                <p className="font-semibold text-sm" style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}>Medication Reminders</p>
                <p className="text-xs mt-1" style={{ color: "#727783" }}>Track your prescriptions & doses</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: "#793100" }}>
                  Manage meds <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* ── Two Column ─────────────────── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Upcoming Appointments */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#ffffff", boxShadow: "0 2px 12px rgba(25,28,30,0.06)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" style={{ color: "#00478d" }} />
                  <h3
                    className="font-bold text-base"
                    style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}
                  >
                    Upcoming Appointments
                  </h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#727783" }}>
                  Your next {upcoming.slice(0, 3).length} scheduled visits
                </p>
              </div>
              <Link href="/student/appointments">
                <button
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:text-white"
                  style={{
                    color: "#00478d",
                    background: "#d6e3ff",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#00478d";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#d6e3ff";
                    (e.currentTarget as HTMLButtonElement).style.color = "#00478d";
                  }}
                >
                  View all
                </button>
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: "#c2c6d4" }} />
                <p className="text-sm" style={{ color: "#727783" }}>No upcoming appointments</p>
                <Link href="/student/appointments">
                  <button
                    className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ background: "#d6e3ff", color: "#00478d" }}
                  >
                    Book one now
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "#f2f4f6" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}
                    >
                      {getInitials(appt.doctorName.replace("Dr. ", ""))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}>
                        {appt.doctorName}
                      </p>
                      <p className="text-xs" style={{ color: "#727783" }}>
                        {appt.specialty} · {formatDate(appt.timeSlot)}
                      </p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "#d6e3ff", color: "#00478d" }}
                    >
                      Booked
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Claims */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#ffffff", boxShadow: "0 2px 12px rgba(25,28,30,0.06)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" style={{ color: "#793100" }} />
                  <h3
                    className="font-bold text-base"
                    style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}
                  >
                    Recent Claims
                  </h3>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#727783" }}>Your insurance claim status</p>
              </div>
              <Link href="/student/insurance">
                <button
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: "#cae2fe", color: "#4a6078" }}
                >
                  View all
                </button>
              </Link>
            </div>

            {claims.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "#c2c6d4" }} />
                <p className="text-sm" style={{ color: "#727783" }}>No claims filed yet</p>
                <Link href="/student/insurance">
                  <button
                    className="mt-3 text-xs font-medium px-3 py-1.5 rounded-lg"
                    style={{ background: "#cae2fe", color: "#4a6078" }}
                  >
                    File a claim
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {claims.slice(0, 4).map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "#f2f4f6" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}>
                        {claim.description}
                      </p>
                      <p className="text-xs" style={{ color: "#727783" }}>{formatDate(claim.createdAt)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}>
                        {formatCurrency(claim.amount)}
                      </p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background:
                            claim.status === "approved"
                              ? "#d6e3ff"
                              : claim.status === "rejected"
                              ? "#ffdad6"
                              : "#ffdbcb",
                          color:
                            claim.status === "approved"
                              ? "#00478d"
                              : claim.status === "rejected"
                              ? "#ba1a1a"
                              : "#793100",
                        }}
                      >
                        {claim.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Wellness Banner ──────────────────────── */}
        <div
          className="rounded-3xl p-8 flex items-center justify-between relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #eceef0, #cae2fe)",
          }}
        >
          <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-20 -translate-y-1/4 translate-x-1/4" style={{ background: "radial-gradient(circle, #005eb8, transparent)" }} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#4a6078" }}>
              Wellness Goals
            </p>
            <p className="text-lg font-bold" style={{ color: "#191c1e", fontFamily: "var(--font-manrope)" }}>
              Your health data is up to date
            </p>
            <p className="text-sm mt-1" style={{ color: "#424752" }}>
              Based on your records, everything looks good. Keep attending your scheduled check-ups.
            </p>
          </div>
          <Link href="/student/medical-records">
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white shrink-0 relative z-10 transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #00478d, #005eb8)",
                boxShadow: "0 4px 16px rgba(0,94,184,0.25)",
              }}
            >
              View Records <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}

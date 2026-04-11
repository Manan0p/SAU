"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  sos: "bg-red-50 border-red-100 text-red-600",
  appointment: "bg-[#005EB8]/10 border-[#005EB8]/20 text-[#005EB8]",
  insurance: "bg-emerald-50 border-emerald-100 text-emerald-700",
  general: "bg-[#F2F4F6] border-[#E6E8EA] text-[#424752]",
};

export function NotificationBell({ userId, variant = "icon" }: { userId: string; variant?: "icon" | "row" }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      {variant === "row" ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[#eceef0] text-[#727783] hover:text-[#191c1e] group"
        >
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <div className="relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center border-2 border-white">
                  {unreadCount > 9 ? "!" : unreadCount}
                </span>
              )}
            </div>
          </div>
          <span>Notifications</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative p-1.5 rounded-lg text-[#727783] hover:text-[#191C1E] hover:bg-[#F2F4F6] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="absolute left-10 bottom-10 w-80 bg-white border border-[#E6E8EA] rounded-2xl shadow-[0_8px_32px_rgba(25,28,30,0.10)] overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6E8EA]">
            <p className="text-sm font-semibold text-[#191C1E]">Notifications</p>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#727783] hover:text-[#191C1E] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#F2F4F6] transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[#F2F4F6] text-[#727783] hover:text-[#191C1E] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-[#F2F4F6] transition-colors",
                    !n.read ? "bg-[#F7F9FB]" : "opacity-70"
                  )}
                >
                  <span className={cn("text-xs px-1.5 py-0.5 rounded-md border font-medium shrink-0 mt-0.5", TYPE_COLORS[n.type] ?? TYPE_COLORS.general)}>
                    {n.type.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#191C1E] truncate">{n.title}</p>
                    <p className="text-xs text-[#424752] mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-[#727783] mt-1">
                      {new Date(n.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="p-1 rounded-lg hover:bg-[#F2F4F6] text-[#727783] hover:text-[#005EB8] transition-colors shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

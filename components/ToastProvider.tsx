"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateId } from "@/lib/utils";
import type { Toast } from "@/types";

interface ToastContextValue {
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = generateId();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 p-4 rounded-xl border shadow-[0_8px_24px_rgba(25,28,30,0.12)] animate-in slide-in-from-right-full duration-300",
            t.variant === "destructive"
              ? "bg-red-50 border-red-200 text-red-800"
              : t.variant === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-white border-[#E6E8EA] text-[#191C1E]"
          )}
        >
          {t.variant === "destructive" ? (
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          ) : t.variant === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-[#005EB8] shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{t.title}</p>
            {t.description && <p className="text-xs opacity-75 mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="opacity-50 hover:opacity-100 transition-opacity shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

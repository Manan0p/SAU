"use client";

import { FileText, Shield, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAuditPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <FileText className="w-8 h-8 text-violet-400" />
          Audit Logs
        </h1>
        <p className="text-slate-400">Platform-level event tracking and security audit trail</p>
      </div>

      <Card className="border-violet-500/20">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Coming Soon</h2>
          <p className="text-slate-400 max-w-sm mx-auto text-sm">
            Audit logging will capture all significant platform actions — logins, role changes, record access, and claim decisions.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm mx-auto">
            {["Login Events", "Role Changes", "Claim Decisions"].map((item) => (
              <div key={item} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <Shield className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500">{item}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

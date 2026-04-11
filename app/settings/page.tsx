"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /settings
 * Simple redirect hub to the default settings tab.
 */
export default function SettingsHubPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/profile");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#F7F9FB]">
      <div className="w-6 h-6 border-2 border-[#00478d]/20 border-t-[#00478d] rounded-full animate-spin" />
    </div>
  );
}

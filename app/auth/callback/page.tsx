"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

/**
 * /auth/callback
 * Client-side handler for Supabase OAuth redirect.
 * The browser client has access to the PKCE code_verifier in localStorage,
 * which is required to exchange the code for a session.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const { initAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Get the code from the URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          // Force re-init auth state then redirect
          await initAuth(true);
          
          // If there's a specific 'next' destination (like reset-password), use it
          const next = params.get("next");
          if (next) {
            router.replace(next);
            return;
          }

          router.replace("/student/dashboard");
          return;
        }
        console.error("OAuth exchange error:", error.message);
      }

      // Also handle hash fragment (implicit flow fallback)
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const errorDescription = hashParams.get("error_description");

      if (accessToken) {
        await initAuth(true);
        const next = params.get("next") || hashParams.get("next");
        if (next) {
          router.replace(next);
          return;
        }
        router.replace("/student/dashboard");
        return;
      }

      if (errorDescription) {
        router.replace("/login?error=" + encodeURIComponent(errorDescription));
        return;
      }

      router.replace("/login?error=auth_callback_failed");
    };

    handleCallback();
  }, [router, initAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f7f9fb" }}>
      <div className="flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #00478d, #005eb8)" }}>
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-[#191c1e] font-bold text-sm">UniWell</p>
          <p className="text-[#727783] text-xs mt-0.5 font-medium">Completing sign in…</p>
        </div>
      </div>
    </div>
  );
}

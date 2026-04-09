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
          router.replace("/dashboard");
          return;
        }
        console.error("OAuth exchange error:", error.message);
      }

      // Also handle hash fragment (implicit flow fallback)
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      if (accessToken) {
        await initAuth(true);
        router.replace("/dashboard");
        return;
      }

      router.replace("/login?error=auth_callback_failed");
    };

    handleCallback();
  }, [router, initAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Completing sign in…</p>
      </div>
    </div>
  );
}

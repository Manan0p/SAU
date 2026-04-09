import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google profile pictures
      { protocol: "https", hostname: "vgznwjhgonqdipgayifv.supabase.co" }, // Supabase storage
    ],
  },
  // Allow @react-google-maps to work correctly
  transpilePackages: ["@react-google-maps/api"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "kpsuxlnwhurxigithtzg.supabase.co" },
      { protocol: "https", hostname: "assets.watermelon.sh" },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "cdn.sanity.io" }, { hostname: "**.spotifycdn.com" }, { hostname: "i.scdn.co" }],
  },
};

export default nextConfig;

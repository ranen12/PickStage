import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tkfile.yes24.com",
      },
    ],
  },
};

export default nextConfig;

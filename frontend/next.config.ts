import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // Automatically remove console.log/info in production, leaving warnings and errors for crash reporting
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
};

export default nextConfig;

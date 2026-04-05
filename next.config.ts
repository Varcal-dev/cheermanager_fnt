import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL}`;

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
  },
};

export default nextConfig;

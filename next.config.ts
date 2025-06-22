import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pysfrtzuhjgcqqmhyoee.supabase.co',
        pathname: '/storage/v1/object/public/complaints/**',
      },
    ],
  },
};

export default nextConfig;

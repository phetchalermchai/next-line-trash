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
    async headers() {
    return [
      {
        source: '/(.*)', // ทุกเส้นทาง
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080', // Origin ของ NestJS
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

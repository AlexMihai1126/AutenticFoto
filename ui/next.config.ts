import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/previewimages-lic-blockchain/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/highrespreviewimages-lic-blockchain/**",
      },
    ],
  },
};

export default nextConfig;

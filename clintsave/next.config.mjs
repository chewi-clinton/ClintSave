/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output standalone to avoid server.js packaging issues

  turbopack: {
    root: process.cwd(),
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Fix the workspace root warning
  turbopack: {
    root: "..",
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

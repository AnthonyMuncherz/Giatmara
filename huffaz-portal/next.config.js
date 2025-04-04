/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Allow cross-origin requests from specific domains
  experimental: {
    allowedDevOrigins: ['zahar.my', 'umbrellacorps.tech', '202.184.46.15', 'localhost', '127.0.0.1'],
  },
};

module.exports = nextConfig; 
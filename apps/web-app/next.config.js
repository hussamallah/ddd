/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

// 🔴 GLOBAL KILL SWITCH: never static-export on Vercel
if (process.env.VERCEL) {
  // Use standard output for Vercel to avoid routing issues
  // nextConfig.output = 'standalone'; // Commented out to fix routes manifest issue
  console.log('[next.config] on Vercel → using standard output');
}

module.exports = nextConfig

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
  nextConfig.output = 'standalone'; // forces server build packaging
  // and if a shared config added export, nuke it:
  // @ts-ignore
  if (nextConfig.output === 'export') nextConfig.output = 'standalone';
  // Helpful visibility:
  console.log('[next.config] on Vercel → output =', nextConfig.output);
}

module.exports = nextConfig

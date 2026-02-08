/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone', // For Docker deployment
    eslint: {
        ignoreDuringBuilds: true, // Disable ESLint during builds
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000',
    },
    // Optimize production bundle
    productionBrowserSourceMaps: false,
    compress: true,
    poweredByHeader: false,
    // Performance optimizations
    swcMinify: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
}

module.exports = nextConfig

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance Optimization (5.2.1 - Bundle Optimization)
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    // Use modern image formats for better compression
    formats: ["image/avif", "image/webp"],
    // Optimize images for different device sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Minimize layout shift with blur placeholder
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Experimental features for performance
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-avatar",
      "@radix-ui/react-progress",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
      "recharts",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "@dnd-kit/modifiers",
    ],
  },

  // Turbopack configuration (Next.js 16+ default bundler)
  // Empty config to acknowledge Turbopack usage
  turbopack: {},

  // Headers for caching static assets (5.2.5 - Caching Strategy)
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },

  // Compress responses
  compress: true,

  // Disable x-powered-by header for security
  poweredByHeader: false,
};

export default nextConfig;

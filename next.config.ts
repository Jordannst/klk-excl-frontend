import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Medium Priority - Clickjacking protection
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Medium Priority - MIME type sniffing protection
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Medium Priority - XSS and injection protection
          // Note: 'unsafe-inline' and 'unsafe-eval' needed for Next.js
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "img-src 'self' data: blob:",
              "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"),
              "frame-ancestors 'none'",
            ].join("; "),
          },
          // Low Priority - Disable unused browser features
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          // Low Priority - Referrer information control
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Low Priority - Popup isolation (allow for print feature)
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          // Low Priority - Resource loading control
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

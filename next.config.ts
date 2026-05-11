import type { NextConfig } from "next";

/**
 * Subdomain routing for multi-school SaaS
 * ─────────────────────────────────────────
 * Each school is accessible via:
 *   schoolname.refugeeschoolos.com   (subdomain, set in School.subdomain)
 *   learn.schoolname.org             (custom domain, set in School.customDomain)
 *
 * Subdomain resolution is handled entirely by middleware.ts, which reads the
 * `host` header, extracts the slug, and injects it as `x-school-subdomain`.
 * The dashboard layout resolves the slug to a school_id via lib/schools.ts.
 *
 * Local development with subdomain routing:
 *   1. Add to /etc/hosts: 127.0.0.1 monrlc.localhost
 *   2. Set NEXT_PUBLIC_BASE_DOMAIN=localhost in .env.local
 *   3. Visit http://monrlc.localhost:3000/dashboard
 */

// ── Security Headers ──────────────────────────────────────────────────────────
// Applied to every response via Next.js headers config.
// Nginx should additionally set HSTS for HTTPS enforcement.
const securityHeaders = [
  // Prevent browsers from MIME-sniffing the content type
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Deny framing entirely to prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },

  // Disable legacy XSS auditor (not needed with modern CSP but belt-and-suspenders)
  { key: "X-XSS-Protection", value: "1; mode=block" },

  // Only send origin on same-origin requests; suppress referrer on cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Restrict access to browser features
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },

  // Content Security Policy
  // Adjust script-src and connect-src when adding third-party integrations.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires 'unsafe-inline' for its inline scripts; nonce-based CSP
      // requires additional Next.js config — use report-only first in production.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Images may come from any HTTPS source (school logos)
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  /**
   * Allow school logo images from any HTTPS source.
   * Narrow this to your CDN/storage hostnames in production.
   */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  /**
   * Security headers applied to all routes.
   * HSTS is intentionally omitted here — set it in Nginx instead so it
   * is only sent over verified HTTPS connections.
   */
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

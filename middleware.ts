import { NextRequest, NextResponse } from "next/server";

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_COOKIE = "school_session";

/**
 * Path prefixes that never require authentication.
 * NOTE: "/" alone is public (landing page). Everything under /dashboard,
 * /super-admin, and /api (except /api/auth) requires a session.
 */
const PUBLIC_PREFIXES = ["/_next", "/static", "/favicon.ico", "/images", "/public", "/api/auth"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login") return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Extracts the tenant subdomain from a hostname.
 *
 * Examples:
 *   mrlc.refugeeschoolos.com        → "mrlc"
 *   schoolname.refugeeschoolos.com  → "schoolname"
 *   refugeeschoolos.com             → null  (root domain, no tenant)
 *   localhost                       → null  (local dev, no subdomain)
 *   localhost:3000                  → null
 *   www.refugeeschoolos.com         → null  (www is not a tenant)
 */
function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0]; // strip port
  const parts = host.split(".");
  // Need at least 3 parts: sub.domain.tld
  if (parts.length < 3) return null;
  const sub = parts[0];
  if (sub === "www" || sub === "app") return null;
  return sub;
}

type MinimalSession = {
  userId: string;
  role: string;
  schoolId?: string;
};

function parseSession(raw: string): MinimalSession | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as MinimalSession;
  } catch {
    return null;
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(hostname);

  // ── 1. Public paths always pass through ───────────────────────────────────
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    if (subdomain) response.headers.set("x-school-subdomain", subdomain);
    return response;
  }

  // ── 2. Read & validate session ────────────────────────────────────────────
  const rawSession = request.cookies.get(SESSION_COOKIE)?.value;

  if (!rawSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  const session = parseSession(rawSession);

  if (!session) {
    // Corrupted session — clear cookie and redirect
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // ── 3. Super-admin area — SUPER_ADMIN only ────────────────────────────────
  if (pathname.startsWith("/super-admin")) {
    if (session.role !== "SUPER_ADMIN") {
      // Redirect non-super-admins silently to their dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return forwardWithHeaders(NextResponse.next(), session, subdomain);
  }

  // ── 4. Dashboard & API routes ─────────────────────────────────────────────
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api/")) {
    // When a subdomain is present, pass it through so the server component
    // can verify the session's schoolId matches the school that owns the subdomain.
    // (Full lookup happens server-side; middleware can't hit the DB.)
    return forwardWithHeaders(NextResponse.next(), session, subdomain);
  }

  return forwardWithHeaders(NextResponse.next(), session, subdomain);
}

/**
 * Attaches session context as request headers so server components can
 * read them without re-parsing the cookie.
 */
function forwardWithHeaders(
  response: NextResponse,
  session: MinimalSession,
  subdomain: string | null
): NextResponse {
  response.headers.set("x-session-user-id", session.userId);
  response.headers.set("x-session-role", session.role);
  if (session.schoolId) response.headers.set("x-session-school-id", session.schoolId);
  if (subdomain) response.headers.set("x-school-subdomain", subdomain);
  return response;
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     * - favicon.ico
     * - *.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp (static assets)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

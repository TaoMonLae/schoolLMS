import { cookies } from "next/headers";
import { AppUser } from "@/lib/types";

export const SESSION_COOKIE = "school_session";

export type SessionPayload = {
  userId: string;
  schoolId?: string;
  role: AppUser["role"];
  name: string;
  assignedClassIds: string[];
  studentId?: string;
  approvedForSensitiveCaseNotes?: boolean;
};

/**
 * Reads the current session from the session cookie.
 *
 * ⚠️  PRODUCTION NOTE: This implementation stores an unsigned base64url JSON cookie.
 *     Replace with NextAuth.js before going live:
 *       npm install next-auth @auth/prisma-adapter
 *     NEXTAUTH_SECRET and NEXTAUTH_URL are already in .env.example for this migration.
 *     See: https://next-auth.js.org/getting-started/introduction
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as SessionPayload;
  } catch {
    return null;
  }
}

/** Reads the session and throws if none is present. Use inside Server Components / Actions. */
export async function getRequiredSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthenticated: no valid session found");
  }
  return session;
}

/** Converts a SessionPayload to the AppUser shape consumed by lib/ data functions. */
export function sessionToAppUser(session: SessionPayload): AppUser {
  return {
    id: session.userId,
    schoolId: session.schoolId,
    role: session.role,
    assignedClassIds: session.assignedClassIds,
    studentId: session.studentId,
    approvedForSensitiveCaseNotes: session.approvedForSensitiveCaseNotes,
  };
}

/**
 * Encodes a session payload to a base64url string suitable for a cookie value.
 * Call this on successful login before setting the cookie.
 */
export function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/**
 * Returns cookie options for the session cookie.
 * Adjust maxAge for your token TTL policy.
 */
export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

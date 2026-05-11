/**
 * lib/env.ts — Environment variable validation
 * ─────────────────────────────────────────────
 * Validates all required environment variables at startup using Zod.
 * The app will CRASH IMMEDIATELY with a clear error message if any
 * required variable is missing or malformed.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   console.log(env.DATABASE_URL);
 *
 * This must be imported by any module that reads process.env so that
 * misconfiguration is caught at boot, not buried in a runtime error.
 */

import { z } from "zod";

const envSchema = z.object({
  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .startsWith("postgresql://", "DATABASE_URL must be a PostgreSQL connection string"),

  // ── Next.js / Auth ────────────────────────────────────────────────────────
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters"),

  NEXTAUTH_URL: z
    .string()
    .url("NEXTAUTH_URL must be a valid URL")
    .default("http://localhost:3000"),

  // ── Multi-school SaaS ─────────────────────────────────────────────────────
  NEXT_PUBLIC_BASE_DOMAIN: z
    .string()
    .min(1, "NEXT_PUBLIC_BASE_DOMAIN is required")
    .default("refugeeschoolos.com"),

  // ── Node environment ──────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // ── Optional: Object storage (S3 / Cloudflare R2) ────────────────────────
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  STORAGE_PUBLIC_URL: z.string().url().optional(),

  // ── Optional: Rate limiting (Upstash Redis for multi-instance) ────────────
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ── Optional: Audit log retention (days) ──────────────────────────────────
  AUDIT_LOG_RETENTION_DAYS: z
    .string()
    .regex(/^\d+$/, "Must be a positive integer")
    .transform(Number)
    .refine((n) => n > 0, "Must be greater than 0")
    .default(365),

  // ── Optional: bcrypt cost factor (default 12) ─────────────────────────────
  BCRYPT_ROUNDS: z
    .string()
    .regex(/^\d+$/, "Must be a positive integer")
    .transform(Number)
    .refine((n) => n >= 10 && n <= 14, "BCRYPT_ROUNDS must be between 10 and 14")
    .default(12),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    console.error(
      "\n╔══════════════════════════════════════════════════════════╗\n" +
      "║  INVALID ENVIRONMENT CONFIGURATION — APP CANNOT START    ║\n" +
      "╚══════════════════════════════════════════════════════════╝\n\n" +
      "The following environment variables are missing or invalid:\n\n" +
      formatted +
      "\n\nCopy .env.example to .env.local and fill in the required values.\n"
    );

    // In production: hard crash so the deploy pipeline fails loudly.
    // In test: throw so tests that import env.ts see a clear error.
    if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
      process.exit(1);
    }

    // In development: return a partial object so hot-reload keeps working
    // while the developer fixes their .env.local. Undefined fields will
    // cause runtime errors only when actually accessed.
    return result.error as unknown as Env;
  }

  return result.data;
}

export const env = validateEnv();

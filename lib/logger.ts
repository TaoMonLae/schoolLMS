/**
 * lib/logger.ts — Structured, PII-safe logger
 * ─────────────────────────────────────────────
 * Provides a structured logger that:
 *   1. Strips sensitive fields from log payloads before output
 *   2. Outputs JSON in production (for log aggregators like Datadog / Loki)
 *   3. Outputs human-readable text in development
 *   4. Never logs passwords, tokens, document numbers, or UNHCR IDs
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("Student record accessed", { studentId, schoolId });
 *   logger.warn("Rate limit approached", { ip, route });
 *   logger.error("DB connection failed", { error });
 *
 * Fields automatically redacted from any nested object depth:
 *   password, passwordHash, token, secret, authorization,
 *   documentNumber, unhcrNumber, guardianPhone, guardianEmail,
 *   accessToken, refreshToken, sessionToken, apiKey, privateKey
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

// ── PII / sensitive field names to redact ─────────────────────────────────────
const REDACTED_FIELDS = new Set([
  "password",
  "passwordhash",
  "token",
  "secret",
  "authorization",
  "cookie",
  "documentnumber",
  "unhcrnumber",
  "unhcrid",
  "guardianemail",
  "guardianphone",
  "accesstoken",
  "refreshtoken",
  "sessiontoken",
  "apikey",
  "privatekey",
  "creditcard",
  "ssn",
  "nationalid",
]);

const REDACTED_MARKER = "[REDACTED]";

/**
 * Recursively redacts sensitive fields from an object.
 * Handles nested objects and arrays. Non-object primitives pass through.
 */
export function redactSensitiveFields(value: unknown, depth = 0): unknown {
  // Guard against circular references and extreme nesting
  if (depth > 10) return "[MAX_DEPTH]";
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveFields(item, depth + 1));
  }

  const sanitised: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (REDACTED_FIELDS.has(key.toLowerCase())) {
      sanitised[key] = REDACTED_MARKER;
    } else {
      sanitised[key] = redactSensitiveFields(val, depth + 1);
    }
  }
  return sanitised;
}

// ── Safe error serialisation ──────────────────────────────────────────────────
function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      // Only include stack in development
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    };
  }
  return { raw: String(err) };
}

// ── Core log function ─────────────────────────────────────────────────────────
function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();

  // Serialize any Error objects in data before redaction
  const serialized: Record<string, unknown> = {};
  if (data) {
    for (const [key, val] of Object.entries(data)) {
      serialized[key] = val instanceof Error ? serializeError(val) : val;
    }
  }

  const sanitisedData = data ? (redactSensitiveFields(serialized) as Record<string, unknown>) : {};

  const entry: LogEntry = {
    level,
    message,
    timestamp,
    ...sanitisedData,
  };

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // JSON output for log aggregators
    const output = JSON.stringify(entry);
    if (level === "error" || level === "warn") {
      process.stderr.write(output + "\n");
    } else {
      process.stdout.write(output + "\n");
    }
  } else {
    // Human-readable output for development
    const prefix = {
      debug: "\x1b[36m[DEBUG]\x1b[0m",
      info:  "\x1b[32m[INFO] \x1b[0m",
      warn:  "\x1b[33m[WARN] \x1b[0m",
      error: "\x1b[31m[ERROR]\x1b[0m",
    }[level];

    const dataStr = Object.keys(sanitisedData).length
      ? " " + JSON.stringify(sanitisedData, null, 0)
      : "";

    const line = `${prefix} ${timestamp} ${message}${dataStr}`;
    if (level === "error" || level === "warn") {
      console.error(line);
    } else {
      console.log(line);
    }
  }
}

// ── Public logger interface ───────────────────────────────────────────────────
export const logger = {
  debug(message: string, data?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      log("debug", message, data);
    }
  },

  info(message: string, data?: Record<string, unknown>): void {
    log("info", message, data);
  },

  warn(message: string, data?: Record<string, unknown>): void {
    log("warn", message, data);
  },

  error(message: string, data?: Record<string, unknown>): void {
    log("error", message, data);
  },

  /**
   * Log a security-relevant event. Always emitted regardless of NODE_ENV.
   * Used for authentication events, access denials, suspicious behaviour.
   */
  security(message: string, data?: Record<string, unknown>): void {
    log("warn", `[SECURITY] ${message}`, data);
  },
};

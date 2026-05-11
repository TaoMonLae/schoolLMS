/**
 * lib/errors.ts — Application error hierarchy
 * ─────────────────────────────────────────────
 * Provides a structured error hierarchy for consistent error handling
 * across Server Actions, API routes, and service functions.
 *
 * Usage in a server action:
 *   import { handleServerActionError, NotFoundError } from "@/lib/errors";
 *
 *   export async function myAction(formData: FormData) {
 *     try {
 *       const student = await getStudent(id);
 *       if (!student) throw new NotFoundError("Student");
 *       ...
 *     } catch (err) {
 *       return handleServerActionError(err);
 *     }
 *   }
 *
 * Usage in an API route:
 *   import { formatErrorResponse } from "@/lib/errors";
 *   return formatErrorResponse(err);
 */

import { logger } from "@/lib/logger";

// ── Base application error ────────────────────────────────────────────────────

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  /** Whether this error should be logged as a warning vs. an error */
  readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Specific error types ──────────────────────────────────────────────────────

export class ValidationError extends AppError {
  readonly fields?: Record<string, string[]>;

  constructor(message: string, fields?: Record<string, string[]>) {
    super(message, 400, "VALIDATION_ERROR");
    this.fields = fields;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds = 60) {
    super(
      `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
      429,
      "RATE_LIMITED"
    );
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// ── Error response formatting ─────────────────────────────────────────────────

export interface ErrorResponse {
  error: string;
  code: string;
  fields?: Record<string, string[]>;
  retryAfter?: number;
}

/**
 * Converts any error into a safe JSON-serialisable error response.
 * Never exposes internal error details or stack traces to the client.
 */
export function formatErrorResponse(err: unknown): { json: ErrorResponse; status: number } {
  if (err instanceof ValidationError) {
    return {
      json: { error: err.message, code: err.code, fields: err.fields },
      status: err.statusCode,
    };
  }

  if (err instanceof RateLimitError) {
    return {
      json: { error: err.message, code: err.code, retryAfter: err.retryAfterSeconds },
      status: err.statusCode,
    };
  }

  if (err instanceof AppError) {
    return {
      json: { error: err.message, code: err.code },
      status: err.statusCode,
    };
  }

  // Unknown / programmer error — log it, return a generic 500
  logger.error("Unhandled error", { error: err });
  return {
    json: { error: "An unexpected error occurred. Please try again.", code: "INTERNAL_ERROR" },
    status: 500,
  };
}

// ── Server action error handler ───────────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  fields?: Record<string, string[]>;
}

/**
 * Wraps a server action error into a serialisable ActionResult.
 * Call this from catch blocks in server actions instead of rethrowing.
 *
 * Note: Next.js redirect() and notFound() throw special signals —
 * we must re-throw those so Next.js can handle them correctly.
 */
export function handleServerActionError(err: unknown): ActionResult {
  // Re-throw Next.js internal signals (redirect, notFound, etc.)
  if (isNextjsInternalError(err)) throw err;

  if (err instanceof ValidationError) {
    return { success: false, error: err.message, code: err.code, fields: err.fields };
  }

  if (err instanceof AppError) {
    return { success: false, error: err.message, code: err.code };
  }

  // Unknown error — log and return generic message
  logger.error("Unhandled server action error", { error: err });
  return { success: false, error: "Something went wrong. Please try again.", code: "INTERNAL_ERROR" };
}

/**
 * Checks whether an error is a Next.js internal error that must be re-thrown.
 * Next.js redirect() and notFound() throw objects with a `digest` field.
 */
function isNextjsInternalError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const digest = (err as Record<string, unknown>).digest;
  if (typeof digest !== "string") return false;
  return (
    digest.startsWith("NEXT_REDIRECT") ||
    digest.startsWith("NEXT_NOT_FOUND") ||
    digest === "DYNAMIC_SERVER_USAGE"
  );
}

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { log } from "@/lib/log";

/**
 * Typed error class. Throw this from anywhere reachable by a route handler
 * and `withApi()` will turn it into a JSON 4xx response with the right status.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const errors = {
  badRequest: (message = "Bad request", details?: unknown) =>
    new ApiError(400, "bad_request", message, details),
  unauthorized: (message = "Unauthorized") =>
    new ApiError(401, "unauthorized", message),
  forbidden: (message = "Forbidden") => new ApiError(403, "forbidden", message),
  notFound: (message = "Not found") => new ApiError(404, "not_found", message),
  conflict: (message = "Conflict") => new ApiError(409, "conflict", message),
  tooMany: (message = "Too many requests") =>
    new ApiError(429, "too_many_requests", message),
  serviceUnavailable: (message = "Service unavailable") =>
    new ApiError(503, "service_unavailable", message),
};

type Handler<T> = () => Promise<T>;

/**
 * Wrap every API route body in this. It catches typed errors, Zod issues,
 * and anything unknown, then returns a uniform JSON envelope so the client
 * never has to guess the error shape.
 *
 *   export const POST = (req: Request) => withApi(async () => {
 *     const body = Schema.parse(await req.json());
 *     ...
 *     return NextResponse.json({ ok: true });
 *   });
 */
export async function withApi<T>(fn: Handler<T>): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: err.code, message: err.message, details: err.details },
        { status: err.status },
      );
    }
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "Invalid input.",
          details: err.flatten(),
        },
        { status: 400 },
      );
    }
    log.error("api_unhandled", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      { error: "internal_error", message: "Something went wrong." },
      { status: 500 },
    );
  }
}

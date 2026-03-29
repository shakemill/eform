import pino from "pino";

/**
 * Structured server logger; use instead of console.error in API routes and server code.
 */
export const logger = pino({
  level:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "development" ? "debug" : "info"),
});

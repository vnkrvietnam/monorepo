import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type JWTPayload } from "../lib/jwt.js";
import { fail } from "../lib/response.js";

// Augment express Request with user context
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Verify Bearer JWT and attach the decoded payload to req.user.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    fail(res, "Unauthorized — missing token", 401, "AUTH_MISSING_TOKEN");
    return;
  }
  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    fail(res, "Unauthorized — invalid or expired token", 401, "AUTH_INVALID_TOKEN");
  }
}

/**
 * Require the caller to have the 'admin' role.
 * Must be used after authenticate().
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    fail(res, "Forbidden — admin access required", 403, "AUTH_FORBIDDEN");
    return;
  }
  next();
}

/**
 * Require compliance role (or admin).
 */
export function requireCompliance(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !["admin", "compliance"].includes(req.user.role)) {
    fail(res, "Forbidden — compliance access required", 403, "AUTH_FORBIDDEN");
    return;
  }
  next();
}

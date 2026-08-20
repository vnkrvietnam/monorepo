import type { Response } from "express";
import type { ApiResponse, PaginatedResponse, PaginationMeta } from "@vnkrvietnam/types";

// ─── Success helpers ──────────────────────────────────────────────────────────

/** 200 OK — single resource or generic payload */
export function ok<T>(res: Response, data: T, message = "Success"): void {
  res.status(200).json({ success: true, message, data } satisfies ApiResponse<T>);
}

/** 201 Created — resource was created */
export function created<T>(res: Response, data: T, message = "Created"): void {
  res.status(201).json({ success: true, message, data } satisfies ApiResponse<T>);
}

/** 204 No Content — action succeeded with no body to return */
export function noContent(res: Response): void {
  res.status(204).end();
}

/**
 * 200 OK — paginated collection.
 * Automatically computes totalPages, hasNext, hasPrev from the provided values.
 */
export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = "Success",
): void {
  const totalPages = Math.ceil(total / limit) || 1;
  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
  res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  } satisfies PaginatedResponse<T>);
}

// ─── Error helper ─────────────────────────────────────────────────────────────

export function fail(
  res: Response,
  message: string,
  statusCode = 400,
  errorCode?: string,
): void {
  res.status(statusCode).json({
    success: false,
    message,
    data:    null,
    errorCode,
  } satisfies ApiResponse<null>);
}

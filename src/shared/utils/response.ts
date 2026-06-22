import { Response } from "express";
import type { ApiResponse, Pagination } from "../types/api.js";

export type { ApiResponse, Pagination };

export function sendResponse<T = unknown>(
  res: Response,
  statusCode: number,
  message: string | undefined,
  data: T,
  pagination?: Pagination
): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };

  if (message !== undefined) {
    body.message = message;
  }

  if (pagination !== undefined) {
    body.pagination = pagination;
  }

  return res.status(statusCode).json(body);
}

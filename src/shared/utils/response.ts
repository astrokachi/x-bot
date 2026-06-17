import { Response } from 'express';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export function sendResponse<T = unknown>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response {
  const body: ApiResponse<T> = { success: true, message };
  if (data !== undefined) {
    body.data = data;
  }
  return res.status(statusCode).json(body);
}

import { Response } from 'express';

interface ApiResponse<T = unknown> {
  status: boolean;
  message: string;
  data?: T;
}

export function sendResponse<T = unknown>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): Response {
  const body: ApiResponse<T> = { status: true, message };
  if (data !== undefined) {
    body.data = data;
  }
  return res.status(statusCode).json(body);
}

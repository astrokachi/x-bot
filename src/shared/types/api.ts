export interface Pagination {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
  pagination?: Pagination;
}

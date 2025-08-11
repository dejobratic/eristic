export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  statusCode: number;
}
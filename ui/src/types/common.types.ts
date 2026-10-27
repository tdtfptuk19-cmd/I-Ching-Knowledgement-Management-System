export interface NormalizedError {
  code: string;
  message: string;
  statusCode?: number;
  fieldErrors?: Record<string, string>;
  rawDetails?: unknown;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  database: string;
}

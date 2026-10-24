export interface NormalizedError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  rawDetails?: unknown;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  database: string;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  readonly name: 'ApiError';
  readonly message: string;
  readonly status: number;
  readonly title?: string;
  readonly detail?: string;
  readonly errors?: Record<string, string[]>;
  readonly instance?: string;
  readonly stack?: string;
}

/**
 * Creates an ApiError data object from an RFC 7807 ProblemDetails payload without classes or casts.
 */
export function createApiError(problem: ProblemDetails): ApiError {
  return {
    name: 'ApiError',
    message: problem.detail || problem.title || `API request failed with status ${problem.status}`,
    status: problem.status,
    title: problem.title,
    detail: problem.detail,
    errors: problem.errors,
    instance: problem.instance,
    stack: new Error().stack,
  };
}

/**
 * Type guard to check if an arbitrary unknown value is an ApiError without type casting.
 */
export function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'name' in value &&
    value.name === 'ApiError' &&
    'status' in value &&
    typeof value.status === 'number'
  );
}

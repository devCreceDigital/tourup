export type AppError = {
  readonly code: string;
  readonly message: string;
};

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AppError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<T>(code: string, message: string): Result<T> {
  return { ok: false, error: { code, message } };
}

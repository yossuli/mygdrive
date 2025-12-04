import type { AppError, Result } from "../types/index.js";

export const success = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

export const failure = <E extends AppError>(error: E): Result<never, E> => ({
  success: false,
  error,
});

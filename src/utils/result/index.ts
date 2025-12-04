import type { Result } from "../../types/index.js";

export const success = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

export const failure = <T>(
  type: string,
  message?: string,
  err?: any,
): Result<T> => ({
  success: false,
  error: {
    type,
    message,
    err,
  },
});

export const handleError = <T>(error: {
  type: string;
  message?: string;
  err?: any;
}): Result<T> => error.message ?? error.err;

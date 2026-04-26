import { HttpError } from "../lib/httpErrors.js";

export function errorHandler(err, req, res, next) {
  const status = err instanceof HttpError ? err.status : 500;
  const payload = {
    error: err.message || "Server error",
  };
  if (err instanceof HttpError && err.details) payload.details = err.details;
  if (status === 500) console.error(err);
  res.status(status).json(payload);
}

import { badRequest } from "../lib/httpErrors.js";

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      return next(badRequest("Validation error", result.error.flatten()));
    }
    req.validated = result.data;
    return next();
  };
}

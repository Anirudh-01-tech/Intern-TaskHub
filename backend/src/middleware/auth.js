import jwt from "jsonwebtoken";
import { unauthorized, forbidden } from "../lib/httpErrors.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");
  if (!token) return next(unauthorized("Missing Bearer token"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { sub, role, name, email }
    return next();
  } catch (e) {
    return next(unauthorized("Invalid or expired token"));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden("Insufficient role"));
    return next();
  };
}

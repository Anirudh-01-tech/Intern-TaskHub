import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { validate } from "../middleware/validate.js";
import { badRequest, unauthorized } from "../lib/httpErrors.js";
import { logActivity } from "../lib/activity.js";

export const authRouter = Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["MANAGER", "INTERN"]).optional(),
    managerInviteCode: z.string().optional(), // reserved for future
  }),
  query: z.any(),
  params: z.any(),
});

authRouter.post("/register", validate(registerSchema), async (req, res, next) => {
  const prisma = req.app.get("prisma");
  const { name, email, password, role } = req.validated.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(badRequest("Email already in use"));

    const passwordHash = await bcrypt.hash(password, 10);

    // If role is omitted, default INTERN. If INTERN, they must be linked to a manager later.
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role ?? "INTERN" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await logActivity(prisma, {
      actorId: user.id,
      type: "USER_REGISTERED",
      entityType: "USER",
      entityId: user.id,
      metadata: { email: user.email, role: user.role }
    });

    res.json({ user });
  } catch (e) {
    next(e);
  }
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  query: z.any(),
  params: z.any(),
});

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  const prisma = req.app.get("prisma");
  const { email, password } = req.validated.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return next(unauthorized("Invalid credentials"));

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return next(unauthorized("Invalid credentials"));

    const token = jwt.sign(
      { sub: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
    );

    await logActivity(prisma, {
      actorId: user.id,
      type: "USER_LOGIN",
      entityType: "USER",
      entityId: user.id,
      metadata: { email: user.email }
    });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    next(e);
  }
});

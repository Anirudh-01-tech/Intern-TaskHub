import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { badRequest } from "../lib/httpErrors.js";
import { logActivity } from "../lib/activity.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, async (req, res, next) => {
  const prisma = req.app.get("prisma");
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, name: true, email: true, role: true, managerId: true, createdAt: true },
    });
    res.json({ user: me });
  } catch (e) {
    next(e);
  }
});

usersRouter.get("/", requireAuth, requireRole("MANAGER"), async (req, res, next) => {
  const prisma = req.app.get("prisma");
  try {
    const interns = await prisma.user.findMany({
      where: { managerId: req.user.sub },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ interns });
  } catch (e) {
    next(e);
  }
});

const createInternSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
  }),
  query: z.any(),
  params: z.any(),
});

usersRouter.post("/", requireAuth, requireRole("MANAGER"), validate(createInternSchema), async (req, res, next) => {
  const prisma = req.app.get("prisma");
  const { name, email, password } = req.validated.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return next(badRequest("A user with this email already exists"));

    const passwordHash = await bcrypt.hash(password, 10);
    const intern = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "INTERN",
        managerId: req.user.sub,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await logActivity(prisma, {
      actorId: req.user.sub,
      type: "USER_REGISTERED",
      entityType: "USER",
      entityId: intern.id,
      metadata: { createdByManager: true, email: intern.email },
    });

    res.status(201).json({ intern });
  } catch (e) {
    next(e);
  }
});

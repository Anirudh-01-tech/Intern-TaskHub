import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

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
    // Simple "team": interns linked to this manager
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

import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const activityRouter = Router();

activityRouter.get("/", requireAuth, requireRole("MANAGER"), async (req, res, next) => {
  const prisma = req.app.get("prisma");
  try {
    const items = await prisma.activityLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
        task: { select: { id: true, title: true } },
      },
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

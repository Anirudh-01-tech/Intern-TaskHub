import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { badRequest, forbidden, notFound } from "../lib/httpErrors.js";
import { logActivity } from "../lib/activity.js";

export const tasksRouter = Router();

// Helpers
function canInternSeeTask(user, task) {
  if (user.role === "MANAGER") return true;
  return task.assignees?.some((a) => a.userId === user.sub);
}

const listSchema = z.object({
  body: z.any(),
  query: z.object({
    status: z.string().optional(),
    overdue: z.string().optional(),
  }).passthrough(),
  params: z.any(),
});

tasksRouter.get("/", requireAuth, validate(listSchema), async (req, res, next) => {
  const prisma = req.app.get("prisma");
  const { status, overdue } = req.validated.query;

  try {
    const where = {};
    if (status) where.status = status;
    if (overdue === "true") {
      where.dueDate = { lt: new Date() };
      where.status = { not: "DONE" };
    }

    let tasks;
    if (req.user.role === "MANAGER") {
      // show tasks created by manager OR tasks assigned to their interns
      tasks = await prisma.task.findMany({
        where,
        include: { assignees: true },
        orderBy: [{ updatedAt: "desc" }],
      });
    } else {
      tasks = await prisma.task.findMany({
        where: {
          ...where,
          assignees: { some: { userId: req.user.sub } },
        },
        include: { assignees: true },
        orderBy: [{ updatedAt: "desc" }],
      });
    }

    // Metrics
    const now = new Date();
    const overdueCount = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE").length;
    const byStatus = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    res.json({ tasks, metrics: { overdueCount, byStatus } });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  body: z.object({
    title: z.string().min(3),

    description: z.string().min(5),

    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),

    dueDate: z.string().datetime().optional(),

    assigneeIds: z.array(z.string()).min(1),
    
  }),
  query: z.any(),
  params: z.any(),
});

tasksRouter.post("/", requireAuth, requireRole("MANAGER"), validate(createSchema), async (req, res, next) => {
  const prisma = req.app.get("prisma");
  const { title, description, priority, dueDate, assigneeIds } = req.validated.body;

  try {
    // Ensure assignees are interns of this manager
    const interns = await prisma.user.findMany({
      where: { id: { in: assigneeIds }, managerId: req.user.sub },
      select: { id: true },
    });
    if (interns.length !== assigneeIds.length) return next(forbidden("You can only assign your own interns"));

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority ?? "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: req.user.sub,
        assignees: { create: assigneeIds.map((id) => ({ userId: id })) },
      },
      include: { assignees: true },
    });

    await logActivity(prisma, {
      actorId: req.user.sub,
      type: "TASK_CREATED",
      entityType: "TASK",
      entityId: task.id,
      taskId: task.id,
      metadata: { title, assigneeIds },
    });

    res.json({ task });
  } catch (e) {
    next(e);
  }
});

tasksRouter.get("/:id", requireAuth, async (req, res, next) => {
  const prisma = req.app.get("prisma");
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignees: true,
        comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true, role: true } } } },
      },
    });
    if (!task) return next(notFound("Task not found"));
    if (!canInternSeeTask(req.user, task)) return next(forbidden("Not allowed"));
    // Hide private comments from interns
    const comments = req.user.role === "MANAGER" ? task.comments : task.comments.filter(c => !c.isPrivate);
    res.json({ task: { ...task, comments } });
  } catch (e) {
    next(e);
  }
});

const updateSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(5).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    dueDate: z.string().datetime().nullable().optional(),
  }),
  query: z.any(),
  params: z.any(),
});

tasksRouter.patch("/:id", requireAuth, requireRole("MANAGER"), validate(updateSchema), async (req, res, next) => {
  const prisma = req.app.get("prisma");
  const updates = req.validated.body;
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return next(notFound("Task not found"));

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...("title" in updates ? { title: updates.title } : {}),
        ...("description" in updates ? { description: updates.description } : {}),
        ...("priority" in updates ? { priority: updates.priority } : {}),
        ...("dueDate" in updates ? { dueDate: updates.dueDate ? new Date(updates.dueDate) : null } : {}),
      },
      include: { assignees: true },
    });

    await logActivity(prisma, {
      actorId: req.user.sub,
      type: "TASK_UPDATED",
      entityType: "TASK",
      entityId: task.id,
      taskId: task.id,
      metadata: { updates },
    });

    res.json({ task });
  } catch (e) {
    next(e);
  }
});

const statusSchema = z.object({
  body: z.object({
    status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "READY_FOR_REVIEW", "DONE"]),
  }),
  query: z.any(),
  params: z.any(),
});

tasksRouter.patch("/:id/status", requireAuth, validate(statusSchema), async (req, res, next) => {
  const prisma = req.app.get("prisma");
  const { status } = req.validated.body;

  const allowedInternTransitions = new Set([
    "TODO->IN_PROGRESS",
    "IN_PROGRESS->BLOCKED",
    "BLOCKED->IN_PROGRESS",
    "IN_PROGRESS->READY_FOR_REVIEW",
    "TODO->BLOCKED",
    "BLOCKED->READY_FOR_REVIEW", // allow if resolved quickly
  ]);

  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { assignees: true },
    });
    if (!task) return next(notFound("Task not found"));
    if (!canInternSeeTask(req.user, task)) return next(forbidden("Not allowed"));

    const from = task.status;
    const to = status;

    if (req.user.role === "INTERN") {
      const key = `${from}->${to}`;
      if (!allowedInternTransitions.has(key)) {
        return next(badRequest("Invalid status transition for intern", { from, to }));
      }
      if (to === "DONE") return next(forbidden("Intern cannot mark DONE"));
      // also ensure they are assigned (already checked)
    }

    // Manager can do any transition, but still validate status enum via schema
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { status: to },
      include: { assignees: true },
    });

    await logActivity(prisma, {
      actorId: req.user.sub,
      type: "TASK_STATUS_CHANGED",
      entityType: "TASK",
      entityId: task.id,
      taskId: task.id,
      metadata: { from, to },
    });

    res.json({ task: updated });
  } catch (e) {
    next(e);
  }
});

const commentSchema = z.object({
  body: z.object({
    body: z.string().min(1).max(2000),
    isPrivate: z.boolean().optional(),
  }),
  query: z.any(),
  params: z.any(),
});

tasksRouter.get("/:id/comments", requireAuth, async (req, res, next) => {
  const prisma = req.app.get("prisma");
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { assignees: true },
    });
    if (!task) return next(notFound("Task not found"));
    if (!canInternSeeTask(req.user, task)) return next(forbidden("Not allowed"));

    const comments = await prisma.comment.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    res.json({ comments: req.user.role === "MANAGER" ? comments : comments.filter(c => !c.isPrivate) });
  } catch (e) {
    next(e);
  }
});

tasksRouter.post("/:id/comments", requireAuth, validate(commentSchema), async (req, res, next) => {
  const prisma = req.app.get("prisma");
  const { body, isPrivate } = req.validated.body;

  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { assignees: true },
    });
    if (!task) return next(notFound("Task not found"));
    if (!canInternSeeTask(req.user, task)) return next(forbidden("Not allowed"));

    const privateFlag = Boolean(isPrivate);

    if (privateFlag && req.user.role !== "MANAGER") {
      return next(forbidden("Only managers can create private notes"));
    }

    const comment = await prisma.comment.create({
      data: {
        taskId: task.id,
        authorId: req.user.sub,
        body,
        isPrivate: privateFlag,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    await logActivity(prisma, {
      actorId: req.user.sub,
      type: privateFlag ? "COMMENT_PRIVATE_ADDED" : "COMMENT_ADDED",
      entityType: "COMMENT",
      entityId: comment.id,
      taskId: task.id,
      metadata: { isPrivate: privateFlag },
    });

    res.json({ comment });
  } catch (e) {
    next(e);
  }
});

tasksRouter.get("/:id/activity", requireAuth, async (req, res, next) => {
  const prisma = req.app.get("prisma");
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { assignees: true },
    });
    if (!task) return next(notFound("Task not found"));
    if (!canInternSeeTask(req.user, task)) return next(forbidden("Not allowed"));

    const items = await prisma.activityLog.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { actor: { select: { id: true, name: true, role: true } } },
    });

    res.json({ items });
  } catch (e) {
    next(e);
  }
});

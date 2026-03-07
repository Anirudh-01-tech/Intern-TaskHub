import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const managerEmail = "manager@taskhub.dev";
  const internEmail = "intern@taskhub.dev";
  const password = "Passw0rd!";

  const managerHash = await bcrypt.hash(password, 10);
  const internHash = await bcrypt.hash(password, 10);

  // Upsert manager
  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {},
    create: {
      name: "Avery Manager",
      email: managerEmail,
      passwordHash: managerHash,
      role: "MANAGER",
    },
  });

  // Upsert intern linked to manager
  const intern = await prisma.user.upsert({
    where: { email: internEmail },
    update: {},
    create: {
      name: "Jordan Intern",
      email: internEmail,
      passwordHash: internHash,
      role: "INTERN",
      managerId: manager.id,
    },
  });

  // Sample task
  const task = await prisma.task.upsert({
    where: { id: "seed-task-1" },
    update: {},
    create: {
      id: "seed-task-1",
      title: "Read API docs and update task status",
      description: "Log in as the intern, move this task to IN_PROGRESS, add a comment, then submit for review.",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      createdById: manager.id,
      assignees: {
        create: [{ userId: intern.id }],
      },
      activities: {
        create: [{
          actorId: manager.id,
          type: "TASK_CREATED",
          entityType: "TASK",
          entityId: "seed-task-1",
          metadata: { seeded: true }
        }]
      }
    },
  });

  // Sample comment
  await prisma.comment.create({
    data: {
      taskId: task.id,
      authorId: manager.id,
      body: "Welcome! Add a short comment when you start.",
      isPrivate: false,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: manager.id,
      type: "COMMENT_ADDED",
      entityType: "COMMENT",
      entityId: "seed-comment-1",
      taskId: task.id,
      metadata: { seeded: true },
    },
  });

  console.log("Seed complete ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

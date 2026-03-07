export async function logActivity(prisma, {
  actorId,
  type,
  entityType,
  entityId,
  taskId = null,
  metadata = null
}) {
  return prisma.activityLog.create({
    data: {
      actorId,
      type,
      entityType,
      entityId,
      taskId,
      metadata
    }
  });
}

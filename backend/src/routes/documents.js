import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { uploadTaskDocuments } from "../middleware/upload.js";

export const documentsRouter = express.Router();

function getUserId(req) {
  return req.user?.id || req.user?.sub || req.user?.userId;
}

function mapDocument(doc) {
  return {
    id: doc.id,

    taskId: doc.task_id,

    uploadedBy: doc.uploaded_by,

    type: doc.type,

    originalName: doc.original_name,

    storedName: doc.stored_name,

    mimeType: doc.mime_type,

    sizeBytes: doc.size_bytes,

    fileUrl: doc.file_url,

    createdAt: doc.created_at,
    
  };
}

documentsRouter.post(
  "/:id/documents",
  requireAuth,
  uploadTaskDocuments.array("documents", 5),
  async (req, res, next) => {
    try {
      const prisma = req.app.get("prisma");
      const taskId = req.params.id;
      const userId = getUserId(req);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: "Please upload at least one document.",
        });
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        return res.status(404).json({
          error: "Task not found.",
        });
      }

      const documents = await Promise.all(
        req.files.map((file) =>
          prisma.taskDocument.create({
            data: {
              task_id: taskId,
              uploaded_by: userId,
              type: "TASK_ATTACHMENT",
              original_name: file.originalname,
              stored_name: file.filename,
              mime_type: file.mimetype,
              size_bytes: file.size,
              file_url: `/uploads/${file.filename}`,
            },
          })
        )
      );

      return res.status(201).json({
        message: "Documents uploaded successfully.",
        documents: documents.map(mapDocument),
      });
    } catch (error) {
      next(error);
    }
  }
);


documentsRouter.post(
  "/:id/complete-with-documents",
  requireAuth,
  uploadTaskDocuments.array("documents", 5),
  async (req, res, next) => {
    try {
      const prisma = req.app.get("prisma");
      const taskId = req.params.id;
      const userId = getUserId(req);

      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        return res.status(404).json({
          error: "Task not found.",
        });
      }

      const uploadedDocuments = req.files || [];

      const documents = await Promise.all(
        uploadedDocuments.map((file) =>
          prisma.taskDocument.create({
            data: {
              task_id: taskId,
              uploaded_by: userId,
              type: "COMPLETION_PROOF",
              original_name: file.originalname,
              stored_name: file.filename,
              mime_type: file.mimetype,
              size_bytes: file.size,
              file_url: `/uploads/${file.filename}`,
            },
          })
        )
      );

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "DONE",
        updatedAt: new Date(),
      },
    });

      try {
        await prisma.activityLog.create({
          data: {
            type: "TASK_STATUS_CHANGED",
            entity_type: "task",
            entity_id: taskId,
            actor_id: userId,
            task_id: taskId,
            metadata: {
              status: "DONE",
              uploadedDocuments: documents.length,
            },
          },
        });
      } catch {
        // Activity logging should not block task completion.
      }

      return res.json({
        message: "Task completed successfully.",
        task: updatedTask,
        documents: documents.map(mapDocument),
      });
    } catch (error) {
      next(error);
    }
  }
);

documentsRouter.get("/:id/documents", requireAuth, async (req, res, next) => {
  try {
    const prisma = req.app.get("prisma");
    const taskId = req.params.id;

    const documents = await prisma.taskDocument.findMany({
      where: {
        task_id: taskId,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return res.json({
      documents: documents.map(mapDocument),
    });
  } catch (error) {
    next(error);
  }
});
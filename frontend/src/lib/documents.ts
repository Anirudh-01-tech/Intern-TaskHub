import api from "./api";

export type TaskDocument = {
  id: string;
  taskId: string;
  uploadedBy: string;
  type: "TASK_ATTACHMENT" | "COMPLETION_PROOF";
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  fileUrl: string;
  createdAt: string;
};

export async function uploadTaskDocuments(taskId: string, files: File[]) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("documents", file);
  });

  const res = await api.post(`/tasks/${taskId}/documents`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

export async function completeTaskWithDocuments(taskId: string, files: File[]) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("documents", file);
  });

  const res = await api.post(
    `/tasks/${taskId}/complete-with-documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
}

export async function getTaskDocuments(taskId: string): Promise<TaskDocument[]> {
  const res = await api.get(`/tasks/${taskId}/documents`);
  return res.data.documents || [];
}

export function formatFileSize(sizeBytes: number) {
  if (!sizeBytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = sizeBytes;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size = size / 1024;
    index += 1;
  }

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
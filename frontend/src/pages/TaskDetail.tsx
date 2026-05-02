import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../state/auth";
import {
  completeTaskWithDocuments,
  formatFileSize,
  getTaskDocuments,
  TaskDocument,
  uploadTaskDocuments,
} from "../lib/documents";
import { Card, CardBody, CardHeader } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

type Role = "MANAGER" | "INTERN";
type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "READY_FOR_REVIEW" | "DONE";

type Comment = {
  id: string;
  body: string;
  isPrivate: boolean;
  createdAt: string;
  author: { name: string; role: Role };
};

type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  comments: Comment[];
};

type ActivityItem = {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  actor: { name: string; role: Role } | null;
};

const statusOrder: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "READY_FOR_REVIEW",
  "DONE",
];

function documentTypeLabel(type: TaskDocument["type"]) {
  return type === "COMPLETION_PROOF" ? "Completion proof" : "Task attachment";
}

export function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);

  const [comment, setComment] = useState("");

  const [privateNote, setPrivateNote] = useState(false);

  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const [documents, setDocuments] = useState<TaskDocument[]>([]);

  const [managerFiles, setManagerFiles] = useState<File[]>([]);

  const [completionFiles, setCompletionFiles] = useState<File[]>([]);

  const [uploading, setUploading] = useState(false);

  const [completing, setCompleting] = useState(false);
  
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);

    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);

      const a = await api.get(`/tasks/${id}/activity`);
      setActivity(a.data.items);

      if (id) {
        const docs = await getTaskDocuments(id);
        setDocuments(docs);
      }
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to load task");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const canInternSet = useMemo(() => {
    if (!task || user?.role !== "INTERN") return [];
    return statusOrder.filter((s) => s !== "DONE");
  }, [task, user?.role]);

  async function setStatus(status: TaskStatus) {
    await api.patch(`/tasks/${id}/status`, { status });
    await load();
  }

  async function addComment() {
    if (!comment.trim()) return;

    await api.post(`/tasks/${id}/comments`, {
      body: comment,
      isPrivate: privateNote,
    });

    setComment("");
    setPrivateNote(false);
    await load();
  }

  async function uploadManagerDocs() {
    if (!id || managerFiles.length === 0) return;

    setUploading(true);
    setErr(null);

    try {
      await uploadTaskDocuments(id, managerFiles);
      setManagerFiles([]);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to upload documents");
    } finally {
      setUploading(false);
    }
  }

  async function completeWithDocs() {
    if (!id) return;

    setCompleting(true);
    setErr(null);

    try {
      await completeTaskWithDocuments(id, completionFiles);
      setCompletionFiles([]);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Failed to complete task");
    } finally {
      setCompleting(false);
    }
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-rose-900/50 bg-rose-950/30 p-4 text-rose-200">
        {err}
      </div>
    );
  }

  if (!task) return <div className="text-slate-400">Loading…</div>;

  const due = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue =
    due ? due.getTime() < Date.now() && task.status !== "DONE" : false;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={task.title}
          subtitle="Task details, status workflow, comments, documents, and audit history."
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{task.status}</Badge>
              <Badge>{task.priority}</Badge>
              {isOverdue ? (
                <span className="text-xs font-semibold text-rose-300">
                  Overdue
                </span>
              ) : null}
            </div>
          }
        />

        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="text-sm text-slate-300">Description</div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">
                {task.description}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="text-xs text-slate-500">Due</div>
              <div className="mt-1 text-sm text-slate-200">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleString()
                  : "No due date"}
              </div>

              <div className="mt-4 text-xs text-slate-500">Update status</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {statusOrder.map((s) => (
                  <Button
                    key={s}
                    variant={task.status === s ? "primary" : "ghost"}
                    className="px-3 py-2 text-xs"
                    onClick={() => setStatus(s)}
                    disabled={user?.role === "INTERN" && s === "DONE"}
                    title={
                      user?.role === "INTERN" && s === "DONE"
                        ? "Use completion documents section below"
                        : ""
                    }
                  >
                    {s}
                  </Button>
                ))}
              </div>

              {user?.role === "INTERN" ? (
                <div className="mt-3 text-xs text-slate-500">
                  Interns should use the completion documents section below to
                  mark a task as DONE.
                </div>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Documents"
          subtitle="Managers can attach task files, and interns can upload completion proof."
        />

        <CardBody>
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-100">
                Uploaded documents
              </div>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={`${api.defaults.baseURL}${doc.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-slate-800 bg-slate-950/50 p-3 transition hover:border-indigo-500/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-100">
                          {doc.originalName}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {documentTypeLabel(doc.type)} •{" "}
                          {formatFileSize(doc.sizeBytes)}
                        </div>
                      </div>

                      <Badge>
                        {doc.type === "COMPLETION_PROOF" ? "Proof" : "File"}
                      </Badge>
                    </div>
                  </a>
                ))}

                {documents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
                    No documents uploaded yet.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              {user?.role === "MANAGER" ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                  <div className="text-sm font-semibold text-slate-100">
                    Add manager documents
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload supporting files, instructions, screenshots, or
                    requirement documents for this task.
                  </p>

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={(e) =>
                      setManagerFiles(Array.from(e.target.files || []))
                    }
                    className="mt-3 block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />

                  {managerFiles.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-xs text-slate-400">
                      {managerFiles.map((file) => (
                        <li key={`${file.name}-${file.size}`}>• {file.name}</li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-3">
                    <Button
                      onClick={uploadManagerDocs}
                      disabled={uploading || managerFiles.length === 0}
                    >
                      {uploading ? "Uploading..." : "Upload documents"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {user?.role === "INTERN" ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                  <div className="text-sm font-semibold text-slate-100">
                    Complete task with documents
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload proof of completion, then mark this task as DONE.
                  </p>

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={(e) =>
                      setCompletionFiles(Array.from(e.target.files || []))
                    }
                    className="mt-3 block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />

                  {completionFiles.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-xs text-slate-400">
                      {completionFiles.map((file) => (
                        <li key={`${file.name}-${file.size}`}>• {file.name}</li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-3">
                    <Button onClick={completeWithDocs} disabled={completing}>
                      {completing ? "Completing..." : "Submit completion"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Comments"
          subtitle="Public discussion + manager-only private notes."
        />

        <CardBody>
          <div className="space-y-3">
            {task.comments.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-100">
                    {c.author.name}{" "}
                    <span className="text-xs text-slate-500">
                      ({c.author.role})
                    </span>
                    {c.isPrivate ? (
                      <span className="ml-2 text-xs font-semibold text-amber-300">
                        Private
                      </span>
                    ) : null}
                  </div>

                  <div className="text-xs text-slate-500">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                  {c.body}
                </div>
              </div>
            ))}

            {task.comments.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-6 text-center text-slate-400">
                No comments yet.
              </div>
            ) : null}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
            <div className="mb-2 text-sm font-semibold text-slate-100">
              Add a comment
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              placeholder="Write an update or a question..."
            />

            {user?.role === "MANAGER" ? (
              <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={privateNote}
                  onChange={(e) => setPrivateNote(e.target.checked)}
                />
                Private note (interns cannot see)
              </label>
            ) : null}

            <div className="mt-3">
              <Button onClick={addComment}>Post comment</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Audit history"
          subtitle="Every status change and comment is logged."
        />

        <CardBody>
          <div className="space-y-2">
            {activity.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-100">
                    <span className="font-semibold">{a.type}</span>{" "}
                    <span className="text-slate-400">by</span>{" "}
                    <span className="font-semibold">
                      {a.actor ? a.actor.name : "System"}
                    </span>
                    {a.actor ? (
                      <span className="text-xs text-slate-500">
                        {" "}
                        ({a.actor.role})
                      </span>
                    ) : null}
                  </div>

                  <div className="text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>

                {a.metadata ? (
                  <pre className="mt-2 overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
                    {JSON.stringify(a.metadata, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))}

            {activity.length === 0 ? (
              <div className="text-slate-400">No activity yet.</div>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
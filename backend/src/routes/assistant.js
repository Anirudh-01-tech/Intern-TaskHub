import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { badRequest, forbidden } from "../lib/httpErrors.js";

export const assistantRouter = Router();

const DEFAULT_ROOT = path.resolve(process.cwd(), "..");
const PROJECT_ROOT = path.resolve(process.env.PROJECT_ROOT || DEFAULT_ROOT);
const ALLOWED_DIRS = [
  "backend/src",
  "backend/prisma",
  "frontend/src",
  "docs",
  "README.md",
];

function isAllowed(rel) {
  return ALLOWED_DIRS.some((dir) => rel === dir || rel.startsWith(`${dir}/`));
}

function safeAbsoluteFromRelative(relPath) {
  const normalized = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
  const abs = path.resolve(PROJECT_ROOT, normalized);
  const relativeFromRoot = path.relative(PROJECT_ROOT, abs).replace(/\\/g, "/");
  if (relativeFromRoot.startsWith("..") || path.isAbsolute(relativeFromRoot)) {
    throw forbidden("Path is outside project root");
  }
  if (!isAllowed(relativeFromRoot)) {
    throw forbidden("Path is not editable through assistant");
  }
  return { abs, rel: relativeFromRoot };
}

async function collectFiles() {
  const found = [];

  async function walk(relBase) {
    const fullBase = path.join(PROJECT_ROOT, relBase);
    let entries = [];
    try {
      entries = await fs.readdir(fullBase, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = path.posix.join(relBase.replace(/\\/g, "/"), entry.name);
      if (entry.isDirectory()) {
        await walk(rel);
      } else if (/\.(js|ts|tsx|md|prisma|json|css)$/i.test(entry.name)) {
        found.push(rel);
      }
    }
  }

  for (const item of ALLOWED_DIRS) {
    const target = path.join(PROJECT_ROOT, item);
    try {
      const stat = await fs.stat(target);
      if (stat.isDirectory()) await walk(item);
      else found.push(item);
    } catch {}
  }

  return found.sort();
}

async function searchFiles(query) {
  const q = query.trim().toLowerCase();
  const files = await collectFiles();
  const matches = [];

  for (const rel of files) {
    const abs = path.join(PROJECT_ROOT, rel);
    let content = "";
    try {
      content = await fs.readFile(abs, "utf8");
    } catch {
      continue;
    }
    const lower = content.toLowerCase();
    const idx = q ? lower.indexOf(q) : -1;
    if (idx >= 0 || rel.toLowerCase().includes(q)) {
      const start = Math.max(0, idx - 120);
      const end = idx >= 0 ? Math.min(content.length, idx + 220) : Math.min(content.length, 220);
      matches.push({
        path: rel,
        excerpt: content.slice(start, end).replace(/\s+/g, " ").trim(),
      });
    }
  }

  return matches.slice(0, 8);
}

function navigationAnswer(message) {
  const text = message.toLowerCase();
  if (text.includes("dashboard")) {
    return "Use Dashboard to view task metrics, search tasks, and open task details. Managers now also get quick actions for Add Task, Add Intern, Team, and Audit Log.";
  }
  if (text.includes("add task") || text.includes("create task")) {
    return "Open the sidebar and choose Add Task. Managers can enter title, description, priority, due date, and one or more intern assignees.";
  }
  if (text.includes("add intern") || text.includes("create intern")) {
    return "Open the sidebar and choose Add Intern. Managers can create a linked intern account directly from the UI.";
  }
  if (text.includes("activity") || text.includes("audit")) {
    return "Open Audit Log from the sidebar to review task creation, status changes, and comments.";
  }
  if (text.includes("team")) {
    return "Open Team to review interns linked to the manager account.";
  }
  if (text.includes("code") || text.includes("file") || text.includes("backend") || text.includes("frontend")) {
    return "You can search the codebase from this assistant. It can find files, open allowed source files, and save edits when file editing is enabled.";
  }
  return null;
}

assistantRouter.post("/chat", requireAuth, async (req, res, next) => {
  const message = String(req.body?.message || "").trim();
  if (!message) return next(badRequest("Message is required"));

  try {
    const nav = navigationAnswer(message);
    const matches = await searchFiles(message);
    const answer = nav || (matches.length
      ? `I searched the local project and found ${matches.length} relevant file match(es). Open one of the matched files to inspect or edit it.`
      : "I could not find a strong codebase match. Try a specific file name, route, page, component, or feature keyword.");

    res.json({
      mode: "local-guide",
      answer,
      suggestions: [
        "Where do I add manager task creation?",
        "Find the dashboard page",
        "Find task routes",
        "Open the team page",
      ],
      matches,
    });
  } catch (e) {
    next(e);
  }
});

assistantRouter.get("/files", requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const files = await collectFiles();
    const filtered = q ? files.filter((f) => f.toLowerCase().includes(q)) : files;
    res.json({ files: filtered.slice(0, 200) });
  } catch (e) {
    next(e);
  }
});

assistantRouter.get("/file", requireAuth, async (req, res, next) => {
  try {
    const relPath = String(req.query.path || "");
    if (!relPath) return next(badRequest("path is required"));
    const { abs, rel } = safeAbsoluteFromRelative(relPath);
    const content = await fs.readFile(abs, "utf8");
    res.json({ path: rel, content, editable: true });
  } catch (e) {
    next(e);
  }
});

assistantRouter.put("/file", requireAuth, requireRole("MANAGER"), async (req, res, next) => {
  if (process.env.ENABLE_FILE_EDITING !== "true") {
    return next(forbidden("File editing is disabled. Set ENABLE_FILE_EDITING=true to allow saving source edits."));
  }

  try {
    const relPath = String(req.body?.path || "");
    const content = String(req.body?.content ?? "");
    if (!relPath) return next(badRequest("path is required"));
    const { abs, rel } = safeAbsoluteFromRelative(relPath);
    await fs.writeFile(abs, content, "utf8");
    res.json({ ok: true, path: rel });
  } catch (e) {
    next(e);
  }
});

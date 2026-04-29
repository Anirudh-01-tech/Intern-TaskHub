import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const assistantRouter = express.Router();

const PROJECT_CONTEXT = `
You are the AI Assistant for Intern TaskHub.

Intern TaskHub is a full-stack intern task management system.

Roles:
- MANAGER
- INTERN

Manager features:
- View dashboard
- Add interns
- Create tasks
- Assign tasks to interns
- View task progress
- View audit/activity logs
- Add comments

Intern features:
- View assigned tasks
- Update task status
- Add comments
- Track task progress

Tech stack:
Frontend: React, TypeScript, Vite, Tailwind CSS.
Backend: Node.js, Express.js, Prisma ORM.
Database: PostgreSQL.
Deployment: Docker and Docker Compose.

Main app pages:
- Dashboard/Home
- Interns
- Add Intern
- Add Task
- Activity Log
- Assistant

Common navigation help:
- To create a task, log in as manager, open the sidebar, click Add Task, fill in title, description, due date, priority, and select an intern assignee.
- To add an intern, open Add Intern from the sidebar.
- To view assigned work, intern users should open their dashboard or assigned tasks page.
- Activity logs show task creation, assignment, comments, and status updates.

Answer like a helpful project assistant.
Keep responses short, clear, and student-friendly.
Do not mention features that are not in the project.
If the user asks about code, explain the likely backend/frontend area, but do not pretend to directly edit files.
`;

assistantRouter.get("/ping", (req, res) => {
  res.json({
    ok: true,
    message: "Gemini assistant route is public and working",
  });
});

assistantRouter.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in backend environment.",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    });

    const prompt = `
${PROJECT_CONTEXT}

User question:
${message}
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return res.json({
      reply: reply || "Sorry, I could not generate a response.",
    });
  } catch (error) {
    console.error("Gemini Assistant error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Assistant failed to respond. Check backend logs and Gemini API key.",
    });
  }
});
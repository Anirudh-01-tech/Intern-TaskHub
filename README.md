# Intern TaskHub — Full-Stack (Plug & Play)

A professional **Manager / Intern** task management portal with:
- JWT auth + role-based access control (RBAC)
- Task workflow (TODO → IN_PROGRESS → READY_FOR_REVIEW → DONE + BLOCKED)
- Comments (public + manager-only private notes)
- Audit log (activity log) for all significant actions
- Dashboard metrics (tasks by status, overdue count)
- PostgreSQL + Prisma ORM
- React + Tailwind CSS frontend (clean, elegant UI)
- Manager task creation UI + add-intern flow
- Responsive sidebar with hamburger navigation
- Local assistant page for app guidance, code search, and optional file editing
- Docker Compose for one-command startup

## Tech stack
- Backend: Node.js (Express) + Prisma + PostgreSQL + JWT + Zod validation
- Frontend: React (Vite + TypeScript) + Tailwind CSS + React Router
- DevOps: Docker + Docker Compose

---

## Quick start (Docker — easiest)
1) Install Docker Desktop
2) From project root:

```bash
docker compose up --build
```

Then open:
- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/health
- API docs (OpenAPI): http://localhost:4000/docs

### Default demo users
After the first boot, the database is auto-seeded:
- Manager
  - email: `manager@taskhub.dev`
  - password: `Passw0rd!`
- Intern
  - email: `intern@taskhub.dev`
  - password: `Passw0rd!`

> If you want to re-seed: delete the docker volume or run `docker compose down -v` then `docker compose up --build`.

---

## Local dev (without Docker)
### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Roles & behavior
- **Manager** can create tasks, assign interns, add interns, edit tasks, review and mark done, view team and audit logs.
- **Intern** can see only tasks assigned to them, update status, comment, upload attachments (not enabled in this starter), and submit for review.

---

## Project structure
- `backend/` Express API + Prisma + OpenAPI docs
- `frontend/` React UI + Tailwind
- `docs/` Notes and API overview

---

## Notes for grading
This project demonstrates:
- Authentication + authorization (RBAC)
- RESTful API design + validation
- Relational DB schema (users/tasks/comments/activity)
- Audit logging and analytics queries
- Dockerized reproducibility and documentation

Good luck!


## Assistant and source editing
- Open **Assistant** from the sidebar to ask navigation questions and search the codebase.
- By default, source editing is disabled for safety.
- To enable saving file changes from the assistant, set `ENABLE_FILE_EDITING="true"` in `backend/.env` or docker-compose.
- In Docker, the project root is mounted into the backend container at `/workspace` so the assistant can inspect both frontend and backend source files.

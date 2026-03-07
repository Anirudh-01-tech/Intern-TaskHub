# Intern TaskHub — Full-Stack (Plug & Play)

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
- **Manager** can create tasks, assign interns, edit tasks, review and mark done, view team and audit logs.
- **Intern** can see only tasks assigned to them, update status, comment, upload attachments (not enabled in this starter), and submit for review.

---

## Project structure
- `backend/` Express API + Prisma + OpenAPI docs
- `frontend/` React UI + Tailwind
- `docs/` Notes and API overview


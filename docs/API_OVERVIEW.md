# API Overview (Intern TaskHub)

## Auth
- POST `/auth/register` { name, email, password, role? }
- POST `/auth/login` { email, password } -> { token, user }

## Users
- GET `/users/me` -> current user
- GET `/users` (manager only) -> interns linked to manager

## Tasks
- GET `/tasks` -> list tasks (intern sees assigned only)
  - query: `status`, `overdue=true`
  - returns `metrics` (byStatus, overdueCount)
- POST `/tasks` (manager only) -> create task { title, description, dueDate, priority, assigneeIds[] }
- GET `/tasks/:id` -> task details + comments (private hidden from intern)
- PATCH `/tasks/:id` (manager only) -> update task
- PATCH `/tasks/:id/status` -> status workflow enforced (intern cannot DONE)
- GET `/tasks/:id/comments`
- POST `/tasks/:id/comments` -> comment + optional `isPrivate` (manager only)
- GET `/tasks/:id/activity` -> audit items for task

## Activity
- GET `/activity` (manager only) -> last 50 audit items

See `/docs` on backend for OpenAPI.

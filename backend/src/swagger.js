export function buildOpenApiSpec() {
  return {
    openapi: "3.0.0",
    info: {
      title: "Intern TaskHub API",
      version: "1.0.0",
      description: "JWT auth + RBAC + tasks + comments + audit log",
    },
    servers: [{ url: "http://localhost:4000" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: { error: { type: "string" }, details: {} },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/health": { get: { security: [], responses: { 200: { description: "OK" } } } },
      "/auth/register": { post: { security: [], responses: { 200: { description: "Registered" } } } },
      "/auth/login": { post: { security: [], responses: { 200: { description: "Logged in" } } } },
      "/users/me": { get: { responses: { 200: { description: "Me" } } } },
      "/tasks": { get: { responses: { 200: { description: "List tasks" } } }, post: { responses: { 200: { description: "Create task" } } } },
      "/tasks/{id}": { get: { responses: { 200: { description: "Task details" } } }, patch: { responses: { 200: { description: "Update task" } } } },
      "/tasks/{id}/status": { patch: { responses: { 200: { description: "Change status" } } } },
      "/tasks/{id}/comments": { get: { responses: { 200: { description: "List comments" } } }, post: { responses: { 200: { description: "Add comment" } } } },
      "/tasks/{id}/activity": { get: { responses: { 200: { description: "Task activity" } } } },
      "/activity": { get: { responses: { 200: { description: "Global activity" } } } },
    },
  };
}

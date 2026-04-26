import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { PrismaClient } from "@prisma/client";

import { buildOpenApiSpec } from "./swagger.js";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { tasksRouter } from "./routes/tasks.js";
import { activityRouter } from "./routes/activity.js";
import { assistantRouter } from "./routes/assistant.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const prisma = new PrismaClient();

app.set("prisma", prisma);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true, service: "taskhub-backend" }));

// OpenAPI docs
const openApiSpec = buildOpenApiSpec();
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/tasks", tasksRouter);
app.use("/activity", activityRouter);
app.use("/assistant", assistantRouter);

app.use(errorHandler);

const port = Number(process.env.PORT || 4000);

async function boot() {
  // Ensure schema exists (no migrations needed)
  // This is executed by calling Prisma's CLI via child process in Docker entrypoint in prod;
  // but for simplicity we run it here on boot when SEED_ON_BOOT is set.
  if (process.env.SEED_ON_BOOT === "true") {
    // db push + seed (best-effort)
    const { execSync } = await import("node:child_process");
    try {
      execSync("npx prisma db push", { stdio: "inherit" });
      execSync("node prisma/seed.js", { stdio: "inherit" });
    } catch (e) {
      console.warn("DB setup/seed skipped (already done or failed):", e?.message ?? e);
    }
  }

  app.listen(port, () => {
    console.log(`✅ TaskHub backend listening on http://localhost:${port}`);
  });
}

boot().catch((e) => {
  console.error(e);
  process.exit(1);
});

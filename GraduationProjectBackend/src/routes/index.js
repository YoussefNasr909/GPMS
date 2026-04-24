//what does this file do? It defines the main router for the application, currently including a test endpoint that responds with "pong" to a "ping" request.

import { Router } from "express";
import usersRouter from "../modules/users/users.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import teamsRouter from "../modules/teams/teams.routes.js";
import githubRouter from "../modules/github/github.routes.js";
import tasksRouter from "../modules/tasks/tasks.routes.js";
import documentsRouter from "../modules/documents/documents.routes.js";
import resourcesRouter from "../modules/resources/resources.routes.js";
import submissionsRouter from "../modules/submissions/submissions.routes.js";
import notificationsRouter from "../modules/notifications/notifications.routes.js";
import discussionsRouter from "../modules/discussions/discussions.routes.js";
const router = Router();

router.get("/ping", (req, res) => {
  res.json({ ok: true, message: "pong" });
});

router.use("/users", usersRouter);
router.use("/auth", authRoutes);
router.use("/teams", teamsRouter);
router.use("/github", githubRouter);
router.use("/tasks", tasksRouter);
router.use("/documents", documentsRouter);
router.use("/resources", resourcesRouter);
router.use("/submissions", submissionsRouter);
router.use("/notifications", notificationsRouter);
router.use("/discussions", discussionsRouter);
export default router;

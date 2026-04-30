import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  acceptTask,
  approveTask,
  bootstrapTaskGithub,
  createTask,
  listTasks,
  openTaskPullRequest,
  rejectTask,
  resyncTaskGithub,
  submitTaskForReview,
  updateTask,
} from "./tasks.controller.js";
import {
  approveTaskSchema,
  bootstrapTaskGithubSchema,
  createTaskSchema,
  listTasksSchema,
  openTaskPullRequestSchema,
  rejectTaskSchema,
  taskActionSchema,
  taskGithubRouteSchema,
  updateTaskSchema,
} from "./tasks.schema.js";

const router = Router();

router.use(auth);

router.get("/", validate(listTasksSchema), listTasks);
router.post("/", validate(createTaskSchema), createTask);
router.patch("/:id", validate(updateTaskSchema), updateTask);
router.post("/:id/accept", validate(taskActionSchema), acceptTask);
router.post("/:id/submit-review", validate(taskActionSchema), submitTaskForReview);
router.post("/:id/approve", validate(approveTaskSchema), approveTask);
router.post("/:id/reject", validate(rejectTaskSchema), rejectTask);
router.post("/:id/github/bootstrap", validate(bootstrapTaskGithubSchema), bootstrapTaskGithub);
router.post("/:id/github/open-pr", validate(openTaskPullRequestSchema), openTaskPullRequest);
router.post("/:id/github/resync", validate(taskGithubRouteSchema), resyncTaskGithub);

export default router;

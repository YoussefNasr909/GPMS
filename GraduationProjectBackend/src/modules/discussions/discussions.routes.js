import { Router } from "express";
import { ROLES } from "../../common/constants/roles.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createDiscussion,
  createDiscussionComment,
  deleteDiscussion,
  deleteDiscussionComment,
  getDiscussionDetail,
  likeDiscussion,
  listDiscussions,
} from "./discussions.controller.js";
import {
  createDiscussionCommentSchema,
  createDiscussionSchema,
  discussionCommentByIdSchema,
  discussionByIdSchema,
  listDiscussionsSchema,
} from "./discussions.schema.js";

const router = Router();

router.use(auth);
router.use(allowRoles(ROLES.STUDENT, ROLES.LEADER, ROLES.DOCTOR, ROLES.TA));

router.get("/", validate(listDiscussionsSchema), listDiscussions);
router.get("/:id", validate(discussionByIdSchema), getDiscussionDetail);
router.post("/", validate(createDiscussionSchema), createDiscussion);
router.post("/:id/comments", validate(createDiscussionCommentSchema), createDiscussionComment);
router.delete("/:id/comments/:commentId", validate(discussionCommentByIdSchema), deleteDiscussionComment);
router.post("/:id/like", validate(discussionByIdSchema), likeDiscussion);
router.delete("/:id", validate(discussionByIdSchema), deleteDiscussion);

export default router;

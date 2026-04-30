import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { ROLES } from "../../common/constants/roles.js";
import {
  createUserSchema,
  getDirectoryUserByIdSchema,
  deleteUserSchema,
  getUserByIdSchema,
  getUsersSummarySchema,
  listDirectoryUsersSchema,
  listUsersSchema,
  updateMeSchema,
  updateMyRoleSchema,
  updateUserSchema,
} from "./users.schema.js";
import {
  createUser,
  deleteUser,
  getDirectoryUserById,
  getUserById,
  getUsersSummary,
  listDirectoryUsers,
  listUsers,
  updateMe,
  updateMyRole,
  updateUser,
} from "./users.controller.js";

const router = Router();

router.use(auth);
router.patch("/me", validate(updateMeSchema), updateMe);
router.patch("/me/role", validate(updateMyRoleSchema), updateMyRole);
router.get("/directory", validate(listDirectoryUsersSchema), listDirectoryUsers);
router.get("/directory/:id", validate(getDirectoryUserByIdSchema), getDirectoryUserById);

router.use(allowRoles(ROLES.ADMIN));

router.get("/summary", validate(getUsersSummarySchema), getUsersSummary);
router.get("/", validate(listUsersSchema), listUsers);
router.post("/", validate(createUserSchema), createUser);
router.get("/:id", validate(getUserByIdSchema), getUserById);
router.patch("/:id", validate(updateUserSchema), updateUser);
router.delete("/:id", validate(deleteUserSchema), deleteUser);

export default router;

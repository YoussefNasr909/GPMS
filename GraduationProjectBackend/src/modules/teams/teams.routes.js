import { Router } from "express";
import { auth } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { ROLES } from "../../common/constants/roles.js";
import {
  acceptInvitation,
  cancelInvitation,
  approveJoinRequest,
  approveSupervisorRequest,
  createInvitation,
  createJoinRequest,
  createSupervisorRequest,
  createTeam,
  declineInvitation,
  declineSupervisorRequest,
  deleteTeam,
  getMyTeamState,
  getTeamById,
  joinTeamByCode,
  leaveTeam,
  listTeams,
  rejectJoinRequest,
  removeSupervisorAssignment,
  removeTeamMember,
  updateTeam,
} from "./teams.controller.js";
import {
  createInvitationSchema,
  createJoinRequestSchema,
  createSupervisorRequestSchema,
  createTeamSchema,
  deleteTeamSchema,
  getMyTeamStateSchema,
  getTeamByIdSchema,
  joinByCodeSchema,
  leaveTeamSchema,
  listTeamsSchema,
  removeSupervisorAssignmentSchema,
  removeTeamMemberSchema,
  respondInvitationSchema,
  reviewJoinRequestSchema,
  reviewSupervisorRequestSchema,
  updateTeamSchema,
} from "./teams.schema.js";

const router = Router();

router.use(auth);

router.get("/my", validate(getMyTeamStateSchema), getMyTeamState);
router.post("/join-by-code", allowRoles(ROLES.STUDENT), validate(joinByCodeSchema), joinTeamByCode);
router.post(
  "/join-requests/:id/approve",
  allowRoles(ROLES.LEADER, ROLES.ADMIN),
  validate(reviewJoinRequestSchema),
  approveJoinRequest,
);
router.post(
  "/join-requests/:id/reject",
  allowRoles(ROLES.LEADER, ROLES.ADMIN),
  validate(reviewJoinRequestSchema),
  rejectJoinRequest,
);
router.post(
  "/invitations/:id/accept",
  allowRoles(ROLES.STUDENT),
  validate(respondInvitationSchema),
  acceptInvitation,
);
router.post(
  "/invitations/:id/decline",
  allowRoles(ROLES.STUDENT),
  validate(respondInvitationSchema),
  declineInvitation,
);
router.post(
  "/invitations/:id/cancel",
  allowRoles(ROLES.LEADER, ROLES.ADMIN),
  validate(respondInvitationSchema),
  cancelInvitation,
);
router.post(
  "/supervisor-requests/:id/accept",
  allowRoles(ROLES.DOCTOR, ROLES.TA),
  validate(reviewSupervisorRequestSchema),
  approveSupervisorRequest,
);
router.post(
  "/supervisor-requests/:id/decline",
  allowRoles(ROLES.DOCTOR, ROLES.TA),
  validate(reviewSupervisorRequestSchema),
  declineSupervisorRequest,
);

router.get("/", validate(listTeamsSchema), listTeams);
router.post("/", allowRoles(ROLES.LEADER), validate(createTeamSchema), createTeam);
router.get("/:id", validate(getTeamByIdSchema), getTeamById);
router.patch("/:id", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(updateTeamSchema), updateTeam);
router.delete("/:id", allowRoles(ROLES.LEADER, ROLES.ADMIN), validate(deleteTeamSchema), deleteTeam);
router.post("/:id/join-requests", allowRoles(ROLES.STUDENT), validate(createJoinRequestSchema), createJoinRequest);
router.post("/:id/invitations", allowRoles(ROLES.LEADER), validate(createInvitationSchema), createInvitation);
router.post(
  "/:id/supervisor-requests",
  allowRoles(ROLES.LEADER),
  validate(createSupervisorRequestSchema),
  createSupervisorRequest,
);
router.post("/:id/leave", allowRoles(ROLES.STUDENT), validate(leaveTeamSchema), leaveTeam);
router.delete(
  "/:id/members/:userId",
  allowRoles(ROLES.LEADER, ROLES.ADMIN),
  validate(removeTeamMemberSchema),
  removeTeamMember,
);

router.delete(
  "/:id/supervisors/:supervisorRole",
  allowRoles(ROLES.LEADER, ROLES.ADMIN),
  validate(removeSupervisorAssignmentSchema),
  removeSupervisorAssignment,
);

export default router;






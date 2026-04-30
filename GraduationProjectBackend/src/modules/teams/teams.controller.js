import {
  acceptInvitationService,
  cancelInvitationService,
  approveJoinRequestService,
  approveSupervisorRequestService,
  createInvitationService,
  createJoinRequestService,
  createSupervisorRequestService,
  createTeamService,
  declineInvitationService,
  declineSupervisorRequestService,
  deleteTeamService,
  getMyTeamStateService,
  getTeamByIdService,
  joinTeamByCodeService,
  leaveTeamService,
  listTeamsService,
  rejectJoinRequestService,
  removeSupervisorAssignmentService,
  removeTeamMemberService,
  updateTeamService,
} from "./teams.service.js";

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const listTeams = asyncHandler(async (req, res) => {
  const result = await listTeamsService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
});

export const getMyTeamState = asyncHandler(async (req, res) => {
  const result = await getMyTeamStateService(req.user);
  res.json({ ok: true, data: result });
});

export const getTeamById = asyncHandler(async (req, res) => {
  const result = await getTeamByIdService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
});

export const createTeam = asyncHandler(async (req, res) => {
  const result = await createTeamService(req.user, req.validated.body);
  res.status(201).json({ ok: true, data: result });
});

export const updateTeam = asyncHandler(async (req, res) => {
  const result = await updateTeamService(req.user, req.validated.params.id, req.validated.body);
  res.json({ ok: true, data: result });
});

export const deleteTeam = asyncHandler(async (req, res) => {
  const result = await deleteTeamService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
});

export const joinTeamByCode = asyncHandler(async (req, res) => {
  const result = await joinTeamByCodeService(req.user, req.validated.body.inviteCode);
  res.json({ ok: true, data: result });
});

export const createJoinRequest = asyncHandler(async (req, res) => {
  const result = await createJoinRequestService(req.user, req.validated.params.id, req.validated.body);
  res.status(201).json({ ok: true, data: result });
});

export const approveJoinRequest = asyncHandler(async (req, res) => {
  const result = await approveJoinRequestService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
});

export const rejectJoinRequest = asyncHandler(async (req, res) => {
  const result = await rejectJoinRequestService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
});

export const createInvitation = asyncHandler(async (req, res) => {
  const result = await createInvitationService(req.user, req.validated.params.id, req.validated.body);
  res.status(201).json({ ok: true, data: result });
});

export const createSupervisorRequest = asyncHandler(async (req, res) => {
  const result = await createSupervisorRequestService(req.user, req.validated.params.id, req.validated.body);
  res.status(201).json({ ok: true, data: result });
});

export const acceptInvitation = asyncHandler(async (req, res) => {
  const result = await acceptInvitationService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
});

export const approveSupervisorRequest = asyncHandler(async (req, res) => {
  const result = await approveSupervisorRequestService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
});

export const declineInvitation = asyncHandler(async (req, res) => {
  const result = await declineInvitationService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
});

export const cancelInvitation = asyncHandler(async (req, res) => {
  const result = await cancelInvitationService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
});

export const declineSupervisorRequest = asyncHandler(async (req, res) => {
  const result = await declineSupervisorRequestService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
});

export const leaveTeam = asyncHandler(async (req, res) => {
  const result = await leaveTeamService(req.user, req.validated.params.id);
  res.json({ ok: true, data: result });
});

export const removeTeamMember = asyncHandler(async (req, res) => {
  const result = await removeTeamMemberService(
    req.user,
    req.validated.params.id,
    req.validated.params.userId,
  );
  res.json({ ok: true, data: result });
});

export const removeSupervisorAssignment = asyncHandler(async (req, res) => {
  const result = await removeSupervisorAssignmentService(
    req.user,
    req.validated.params.id,
    req.validated.params.supervisorRole,
  );
  res.json({ ok: true, data: result });
});
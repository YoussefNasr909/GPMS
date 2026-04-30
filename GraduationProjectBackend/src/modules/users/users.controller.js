import {
  createUserService,
  deleteUserService,
  getDirectoryUserByIdService,
  getUserByIdService,
  getUsersSummaryService,
  listDirectoryUsersService,
  listUsersService,
  updateMeService,
  updateMyRoleService,
  updateUserService,
} from "./users.service.js";

export async function createUser(req, res) {
  const user = await createUserService(req.validated.body);
  res.status(201).json({ ok: true, data: user });
}

export async function getUserById(req, res) {
  const { id } = req.validated.params;
  const user = await getUserByIdService(id);
  res.json({ ok: true, data: user });
}

export async function listUsers(req, res) {
  const { page, limit, search, role, status } = req.validated.query;
  const result = await listUsersService({ page, limit, search, role, status });
  res.json({ ok: true, data: result });
}

export async function getUsersSummary(req, res) {
  const result = await getUsersSummaryService();
  res.json({ ok: true, data: result });
}

export async function updateUser(req, res) {
  const updated = await updateUserService(req.user.id, req.validated.params.id, req.validated.body);
  res.json({ ok: true, data: updated });
}

export async function deleteUser(req, res) {
  const deleted = await deleteUserService(req.user.id, req.validated.params.id);
  res.json({ ok: true, data: deleted });
}

export async function updateMe(req, res) {
  const updated = await updateMeService(req.user.id, req.validated.body);
  res.json({ ok: true, data: updated });
}

export async function updateMyRole(req, res) {
  const updated = await updateMyRoleService(req.user.id, req.validated.body);
  res.json({ ok: true, data: updated });
}

export async function listDirectoryUsers(req, res) {
  const result = await listDirectoryUsersService(req.validated.query);
  res.json({ ok: true, data: result });
}

export async function getDirectoryUserById(req, res) {
  const result = await getDirectoryUserByIdService(req.validated.params.id);
  res.json({ ok: true, data: result });
}

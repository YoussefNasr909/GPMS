import {
  approveRiskService,
  createRiskService,
  listRisksService,
  requestRiskRevisionService,
  updateRiskService,
} from "./risks.service.js";

export async function listRisks(req, res) {
  const result = await listRisksService(req.user, req.validated.query);
  res.json({ ok: true, data: result });
}

export async function createRisk(req, res) {
  const result = await createRiskService(req.user, req.validated.body);
  res.status(201).json({ ok: true, data: result });
}

export async function updateRisk(req, res) {
  const result = await updateRiskService(req.user, req.validated.params.id, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function approveRisk(req, res) {
  const result = await approveRiskService(req.user, req.validated.params.id, req.validated.body);
  res.json({ ok: true, data: result });
}

export async function requestRiskRevision(req, res) {
  const result = await requestRiskRevisionService(req.user, req.validated.params.id, req.validated.body);
  res.json({ ok: true, data: result });
}

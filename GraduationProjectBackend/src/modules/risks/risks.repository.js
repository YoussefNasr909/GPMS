import { prisma } from "../../loaders/dbLoader.js";
import { teamUserSelect } from "../teams/teams.repository.js";

const riskTeamSelect = {
  id: true,
  name: true,
  leader: { select: teamUserSelect },
  doctor: { select: teamUserSelect },
  ta: { select: teamUserSelect },
  members: {
    orderBy: { joinedAt: "asc" },
    select: {
      id: true,
      joinedAt: true,
      user: { select: teamUserSelect },
    },
  },
};

export const riskSelect = {
  id: true,
  teamId: true,
  title: true,
  description: true,
  category: true,
  chance: true,
  impact: true,
  severity: true,
  status: true,
  approvalStatus: true,
  mitigation: true,
  monitoringNotes: true,
  resolutionNotes: true,
  approvalNote: true,
  createdByUserId: true,
  monitorUserId: true,
  approvedByUserId: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  team: { select: riskTeamSelect },
  createdBy: { select: teamUserSelect },
  monitor: { select: teamUserSelect },
  approvedBy: { select: teamUserSelect },
};

export function listRisks(where, tx = prisma) {
  return tx.risk.findMany({
    where,
    orderBy: [{ approvalStatus: "asc" }, { updatedAt: "desc" }],
    select: riskSelect,
  });
}

export function findRiskById(id, tx = prisma) {
  return tx.risk.findUnique({
    where: { id },
    select: riskSelect,
  });
}

export function createRisk(data, tx = prisma) {
  return tx.risk.create({
    data,
    select: riskSelect,
  });
}

export function updateRiskById(id, data, tx = prisma) {
  return tx.risk.update({
    where: { id },
    data,
    select: riskSelect,
  });
}

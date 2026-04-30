import { AppError } from "../../common/errors/AppError.js";
import { ROLES } from "../../common/constants/roles.js";
import { prisma } from "../../loaders/dbLoader.js";
import {
  findSubmissionById,
  listSubmissionsByFilter,
  createSubmission,
  updateSubmission,
  deleteSubmissionById,
  listSubmissionsByTeamAndPhase,
  getLatestVersionForDeliverable,
} from "./submissions.repository.js";
import { findTeamByLeaderId, findTeamMemberByUserId } from "../teams/teams.repository.js";
import { notify } from "../../common/utils/notify.js";

// SDLC phase → required/optional deliverables mapping
const SDLC_PHASE_DELIVERABLES = {
  REQUIREMENTS: {
    required: ["SRS"],
    optional: [],
    label: "Requirements Analysis",
    order: 0,
    description: "Gather, analyze, and document comprehensive project requirements",
  },
  DESIGN: {
    required: ["UML"],
    optional: [],
    label: "System Design",
    order: 1,
    description: "Design system architecture, database schema, and user interfaces",
  },
  IMPLEMENTATION: {
    required: ["CODE"],
    optional: ["PROTOTYPE"],
    label: "Implementation & Development",
    order: 2,
    description: "Develop the system following design specifications",
  },
  TESTING: {
    required: ["TEST_PLAN"],
    optional: [],
    label: "Testing & Quality Assurance",
    order: 3,
    description: "Comprehensive testing to verify functionality and quality",
  },
  DEPLOYMENT: {
    required: ["FINAL_REPORT", "PRESENTATION"],
    optional: [],
    label: "Deployment & Release",
    order: 4,
    description: "Deploy the system and produce final deliverables",
  },
  MAINTENANCE: {
    required: [],
    optional: [],
    label: "Maintenance & Support",
    order: 5,
    description: "Ongoing monitoring, bug fixes, and enhancements",
  },
};

// Which SDLC phase each deliverable type belongs to
const DELIVERABLE_TO_PHASE = {
  SRS: "REQUIREMENTS",
  UML: "DESIGN",
  PROTOTYPE: "IMPLEMENTATION",
  CODE: "IMPLEMENTATION",
  TEST_PLAN: "TESTING",
  FINAL_REPORT: "DEPLOYMENT",
  PRESENTATION: "DEPLOYMENT",
};

const STAGE_ORDER = [
  "REQUIREMENTS",
  "DESIGN",
  "IMPLEMENTATION",
  "TESTING",
  "DEPLOYMENT",
  "MAINTENANCE",
];

function buildFullName(user) {
  return `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
}

function toSubmissionResponse(submission) {
  return {
    ...submission,
    submittedBy: submission.submittedBy
      ? { ...submission.submittedBy, fullName: buildFullName(submission.submittedBy) }
      : null,
    reviewedBy: submission.reviewedBy
      ? { ...submission.reviewedBy, fullName: buildFullName(submission.reviewedBy) }
      : null,
  };
}

async function resolveActorTeam(actor) {
  if (actor.role === ROLES.LEADER) {
    return findTeamByLeaderId(actor.id);
  }
  if (actor.role === ROLES.STUDENT) {
    const membership = await findTeamMemberByUserId(actor.id);
    return membership?.team ?? null;
  }
  return null;
}

async function resolveVisibleTeamIds(actor) {
  if (actor.role === ROLES.LEADER) {
    const team = await findTeamByLeaderId(actor.id);
    return team ? [team.id] : [];
  }
  if (actor.role === ROLES.STUDENT) {
    const membership = await findTeamMemberByUserId(actor.id);
    return membership?.team?.id ? [membership.team.id] : [];
  }
  if (actor.role === ROLES.DOCTOR) {
    const teams = await prisma.team.findMany({ where: { doctorId: actor.id }, select: { id: true } });
    return teams.map((t) => t.id);
  }
  if (actor.role === ROLES.TA) {
    const teams = await prisma.team.findMany({ where: { taId: actor.id }, select: { id: true } });
    return teams.map((t) => t.id);
  }
  if (actor.role === ROLES.ADMIN) return null; // null = all teams
  return [];
}

export async function listSubmissionsService(actor, query) {
  let visibleTeamIds = await resolveVisibleTeamIds(actor);

  if (visibleTeamIds !== null && visibleTeamIds.length === 0) {
    return [];
  }

  if (query.teamId) {
    if (visibleTeamIds !== null && !visibleTeamIds.includes(query.teamId)) {
      throw new AppError("You do not have access to this team's submissions.", 403, "SUBMISSIONS_FORBIDDEN");
    }
    visibleTeamIds = [query.teamId];
  }

  const submissions = await listSubmissionsByFilter({
    teamIds: visibleTeamIds,
    sdlcPhase: query.sdlcPhase,
    deliverableType: query.deliverableType,
    status: query.status,
  });

  return submissions.map(toSubmissionResponse);
}

export async function createSubmissionService(actor, payload, file) {
  if (actor.role !== ROLES.LEADER) {
    throw new AppError("Only the team leader can submit deliverables.", 403, "SUBMISSION_CREATE_FORBIDDEN");
  }

  const team = await findTeamByLeaderId(actor.id);
  if (!team) {
    throw new AppError("You must have a team to submit deliverables.", 403, "NO_TEAM");
  }

  const { deliverableType, sdlcPhase, title, notes, deadline, fileUrl } = payload;

  // Validate deliverable belongs to the claimed SDLC phase
  const expectedPhase = DELIVERABLE_TO_PHASE[deliverableType];
  if (expectedPhase && expectedPhase !== sdlcPhase) {
    throw new AppError(
      `"${deliverableType}" belongs to the "${expectedPhase}" phase, not "${sdlcPhase}".`,
      422,
      "SUBMISSION_PHASE_MISMATCH",
    );
  }

  const latestVersion = await getLatestVersionForDeliverable(team.id, deliverableType);
  const version = latestVersion + 1;
  const isLate = deadline ? new Date() > new Date(deadline) : false;

  const data = {
    teamId: team.id,
    deliverableType,
    sdlcPhase,
    sourceType: "MANUAL_UPLOAD",
    title: title || null,
    notes: notes || null,
    status: "PENDING",
    version,
    late: isLate,
    deadline: deadline ? new Date(deadline) : null,
    submittedByUserId: actor.id,
    submittedAt: new Date(),
    ...(file && {
      fileName: file.originalname,
      fileSize: file.size,
      fileType: (file.originalname || "").split(".").pop()?.toUpperCase() || "FILE",
      fileUrl,
    }),
  };

  const submission = await createSubmission(data);
  return toSubmissionResponse(submission);
}

export async function getSubmissionService(actor, submissionId) {
  const submission = await findSubmissionById(submissionId);
  if (!submission) {
    throw new AppError("Submission not found.", 404, "SUBMISSION_NOT_FOUND");
  }

  const visibleTeamIds = await resolveVisibleTeamIds(actor);
  if (visibleTeamIds !== null && !visibleTeamIds.includes(submission.teamId)) {
    throw new AppError("You do not have access to this submission.", 403, "SUBMISSION_FORBIDDEN");
  }

  return toSubmissionResponse(submission);
}

async function assertSupervisorForTeam(actor, teamId) {
  if (actor.role === ROLES.ADMIN) return;
  const team = await prisma.team.findFirst({
    where: { id: teamId, OR: [{ doctorId: actor.id }, { taId: actor.id }] },
  });
  if (!team) {
    throw new AppError("You are not a supervisor for this team.", 403, "SUBMISSION_SUPERVISOR_FORBIDDEN");
  }
}

export async function gradeSubmissionService(actor, submissionId, { grade, feedback }) {
  if (actor.role !== ROLES.DOCTOR && actor.role !== ROLES.TA && actor.role !== ROLES.ADMIN) {
    throw new AppError("Only supervisors can grade submissions.", 403, "SUBMISSION_GRADE_FORBIDDEN");
  }

  const submission = await findSubmissionById(submissionId);
  if (!submission) {
    throw new AppError("Submission not found.", 404, "SUBMISSION_NOT_FOUND");
  }

  await assertSupervisorForTeam(actor, submission.teamId);

  if (submission.status === "APPROVED") {
    throw new AppError("This submission is already approved.", 409, "SUBMISSION_ALREADY_APPROVED");
  }

  const updated = await updateSubmission(submissionId, {
    grade,
    feedback: feedback || null,
    status: "APPROVED",
    reviewedByUserId: actor.id,
    reviewedAt: new Date(),
  });

  // Notify the submitter their submission was graded
  const submitterUserId = submission.submittedByUserId ?? submission.submittedBy?.id ?? null;
  if (submitterUserId) {
    const gradeText = grade !== null && grade !== undefined ? ` \u2014 Grade: ${grade}` : "";
    await notify({
      userId: submitterUserId,
      type: "SUBMISSION_GRADED",
      title: "Submission Graded",
      message: `Your "${submission.deliverableType}" submission has been approved by ${buildFullName(actor)}${gradeText}.`,
      actionUrl: "/dashboard/submissions",
    });
  } else {
    console.warn(`[notify] gradeSubmission: could not resolve submitter userId for submission ${submissionId}`);
  }

  return toSubmissionResponse(updated);
}

export async function requestRevisionService(actor, submissionId, { feedback }) {
  if (actor.role !== ROLES.DOCTOR && actor.role !== ROLES.TA && actor.role !== ROLES.ADMIN) {
    throw new AppError("Only supervisors can request revisions.", 403, "SUBMISSION_REVISION_FORBIDDEN");
  }

  const submission = await findSubmissionById(submissionId);
  if (!submission) {
    throw new AppError("Submission not found.", 404, "SUBMISSION_NOT_FOUND");
  }

  await assertSupervisorForTeam(actor, submission.teamId);

  if (submission.status === "APPROVED") {
    throw new AppError("Cannot request revision on an approved submission.", 409, "SUBMISSION_ALREADY_APPROVED");
  }

  const updated = await updateSubmission(submissionId, {
    feedback,
    status: "REVISION_REQUIRED",
    reviewedByUserId: actor.id,
    reviewedAt: new Date(),
  });

  // Notify the submitter that changes are needed
  const submitterUserId = submission.submittedByUserId ?? submission.submittedBy?.id ?? null;
  if (submitterUserId) {
    await notify({
      userId: submitterUserId,
      type: "SUBMISSION_FEEDBACK",
      title: "Revision Requested",
      message: `${buildFullName(actor)} has requested revisions on your "${submission.deliverableType}" submission: "${feedback}".`,
      actionUrl: "/dashboard/submissions",
    });
  } else {
    console.warn(`[notify] requestRevision: could not resolve submitter userId for submission ${submissionId}`);
  }

  return toSubmissionResponse(updated);
}

export async function deleteSubmissionService(actor, submissionId) {
  if (actor.role !== ROLES.LEADER && actor.role !== ROLES.ADMIN) {
    throw new AppError("Only the team leader can delete submissions.", 403, "SUBMISSION_DELETE_FORBIDDEN");
  }

  const submission = await findSubmissionById(submissionId);
  if (!submission) {
    throw new AppError("Submission not found.", 404, "SUBMISSION_NOT_FOUND");
  }

  if (actor.role === ROLES.LEADER) {
    const team = await findTeamByLeaderId(actor.id);
    if (!team || team.id !== submission.teamId) {
      throw new AppError("You can only delete your own team's submissions.", 403, "SUBMISSION_DELETE_FORBIDDEN");
    }
  }

  if (submission.status === "APPROVED") {
    throw new AppError("Cannot delete an approved submission.", 409, "SUBMISSION_APPROVED_IMMUTABLE");
  }

  return deleteSubmissionById(submissionId);
}

export async function getSDLCSummaryService(actor, query) {
  let teamId = query.teamId;

  if (!teamId) {
    const team = await resolveActorTeam(actor);
    if (team) {
      teamId = team.id;
    } else if (actor.role === ROLES.DOCTOR) {
      const teams = await prisma.team.findMany({ where: { doctorId: actor.id }, select: { id: true } });
      if (teams.length === 1) teamId = teams[0].id;
    } else if (actor.role === ROLES.TA) {
      const teams = await prisma.team.findMany({ where: { taId: actor.id }, select: { id: true } });
      if (teams.length === 1) teamId = teams[0].id;
    }
  }

  if (!teamId) {
    throw new AppError("teamId is required.", 422, "TEAM_ID_REQUIRED");
  }

  const visibleTeamIds = await resolveVisibleTeamIds(actor);
  if (visibleTeamIds !== null && !visibleTeamIds.includes(teamId)) {
    throw new AppError("You do not have access to this team's SDLC data.", 403, "SDLC_FORBIDDEN");
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true, stage: true },
  });

  if (!team) {
    throw new AppError("Team not found.", 404, "TEAM_NOT_FOUND");
  }

  const currentStageIndex = STAGE_ORDER.indexOf(team.stage);

  const phases = await Promise.all(
    Object.entries(SDLC_PHASE_DELIVERABLES).map(async ([phase, config]) => {
      const submissions = await listSubmissionsByTeamAndPhase(teamId, phase);
      const approvedTypes = new Set(
        submissions.filter((s) => s.status === "APPROVED").map((s) => s.deliverableType),
      );

      const requiredApproved = config.required.filter((d) => approvedTypes.has(d)).length;
      const requiredComplete = config.required.every((d) => approvedTypes.has(d));

      let progress;
      if (config.required.length === 0) {
        progress = 100;
      } else {
        progress = Math.round((requiredApproved / config.required.length) * 100);
      }

      const stageIndex = STAGE_ORDER.indexOf(phase);
      let status;
      if (stageIndex < currentStageIndex) {
        status = "completed";
      } else if (stageIndex === currentStageIndex) {
        status = requiredComplete ? "completed" : "in-progress";
      } else {
        status = "upcoming";
      }

      return {
        phase,
        label: config.label,
        description: config.description,
        order: config.order,
        status,
        progress,
        requiredDeliverables: config.required,
        optionalDeliverables: config.optional,
        requiredComplete,
        submissions: submissions.map(toSubmissionResponse),
        canAdvance: stageIndex === currentStageIndex && requiredComplete && stageIndex < STAGE_ORDER.length - 1,
      };
    }),
  );

  const currentPhaseData = phases.find((p) => p.phase === team.stage) || null;
  const overallProgress = Math.round(phases.reduce((acc, p) => acc + p.progress, 0) / phases.length);
  const nextStage = STAGE_ORDER[currentStageIndex + 1] ?? null;

  return {
    team: { id: team.id, name: team.name, stage: team.stage },
    currentPhase: currentPhaseData,
    overallProgress,
    phases,
    canAdvanceStage: currentPhaseData?.canAdvance ?? false,
    nextStage,
  };
}

export async function advanceStageService(actor, query) {
  if (actor.role !== ROLES.LEADER && actor.role !== ROLES.ADMIN) {
    throw new AppError("Only the team leader can advance the project stage.", 403, "ADVANCE_STAGE_FORBIDDEN");
  }

  let team;
  if (actor.role === ROLES.LEADER) {
    team = await findTeamByLeaderId(actor.id);
    if (!team) throw new AppError("You do not have a team.", 403, "NO_TEAM");
  } else {
    if (!query.teamId) throw new AppError("teamId is required.", 422, "TEAM_ID_REQUIRED");
    team = await prisma.team.findUnique({ where: { id: query.teamId } });
    if (!team) throw new AppError("Team not found.", 404, "TEAM_NOT_FOUND");
  }

  const currentIndex = STAGE_ORDER.indexOf(team.stage);
  if (currentIndex === STAGE_ORDER.length - 1) {
    throw new AppError("Team is already in the final SDLC stage.", 409, "ALREADY_FINAL_STAGE");
  }

  const currentConfig = SDLC_PHASE_DELIVERABLES[team.stage];
  if (currentConfig.required.length > 0) {
    const approved = await prisma.submission.findMany({
      where: {
        teamId: team.id,
        sdlcPhase: team.stage,
        status: "APPROVED",
        deliverableType: { in: currentConfig.required },
      },
      select: { deliverableType: true },
    });
    const approvedTypes = new Set(approved.map((s) => s.deliverableType));
    const missing = currentConfig.required.filter((d) => !approvedTypes.has(d));

    if (missing.length > 0) {
      throw new AppError(
        `Cannot advance. The following deliverables must be approved first: ${missing.join(", ")}.`,
        422,
        "REQUIRED_DELIVERABLES_NOT_APPROVED",
      );
    }
  }

  const nextStage = STAGE_ORDER[currentIndex + 1];
  const updated = await prisma.team.update({
    where: { id: team.id },
    data: { stage: nextStage },
    select: { id: true, name: true, stage: true },
  });

  // Notify the leader + all team members about the stage change
  const fullTeam = await prisma.team.findUnique({
    where: { id: team.id },
    select: {
      leaderId: true,
      members: { select: { userId: true } },
    },
  });

  if (fullTeam) {
    const memberUserIds = fullTeam.members.map((m) => m.userId);
    const allUserIds = [fullTeam.leaderId, ...memberUserIds];

    await Promise.all(
      allUserIds.map((userId) =>
        notify({
          userId,
          type: "SYSTEM",
          title: "Project Stage Advanced",
          message: `Your team's project has moved to the "${nextStage}" phase. Time to focus on the next deliverables!`,
          actionUrl: "/dashboard/submissions",
        }),
      ),
    );
  }

  return {
    team: updated,
    previousStage: team.stage,
    newStage: nextStage,
    message: `Project advanced to ${nextStage} stage.`,
  };
}

import test from "node:test";
import assert from "node:assert/strict";
import { syncTeamGroupConversationForTeam } from "./team-chat.service.js";

function createSyncTx({ team, existingParticipants = [] }) {
  const calls = {
    findTeam: [],
    upsertConversation: [],
    findParticipants: [],
    createManyParticipants: [],
    deleteManyParticipants: [],
  };

  const tx = {
    team: {
      findUnique: async (args) => {
        calls.findTeam.push(args);
        return team;
      },
    },
    teamGroupConversation: {
      upsert: async (args) => {
        calls.upsertConversation.push(args);
        return { id: "conversation-1" };
      },
    },
    teamGroupConversationParticipant: {
      findMany: async (args) => {
        calls.findParticipants.push(args);
        return existingParticipants;
      },
      createMany: async (args) => {
        calls.createManyParticipants.push(args);
        return { count: args.data.length };
      },
      deleteMany: async (args) => {
        calls.deleteManyParticipants.push(args);
        return { count: args.where.userId.in.length };
      },
    },
  };

  return { tx, calls };
}

test("syncTeamGroupConversationForTeam creates the group chat and adds student participants", async () => {
  const { tx, calls } = createSyncTx({
    team: {
      id: "team-1",
      leader: { id: "leader-1", role: "LEADER" },
      members: [
        { userId: "student-1", user: { role: "STUDENT" } },
        { userId: "doctor-1", user: { role: "DOCTOR" } },
        { userId: "ta-1", user: { role: "TA" } },
      ],
    },
  });

  const conversationId = await syncTeamGroupConversationForTeam("team-1", tx);

  assert.equal(conversationId, "conversation-1");
  assert.deepEqual(calls.upsertConversation[0].create, { teamId: "team-1" });
  assert.deepEqual(calls.createManyParticipants[0], {
    data: [
      { conversationId: "conversation-1", userId: "leader-1" },
      { conversationId: "conversation-1", userId: "student-1" },
    ],
    skipDuplicates: true,
  });
  assert.equal(calls.deleteManyParticipants.length, 0);
});

test("syncTeamGroupConversationForTeam removes participants who are no longer student team members", async () => {
  const { tx, calls } = createSyncTx({
    team: {
      id: "team-1",
      leader: { id: "leader-1", role: "LEADER" },
      members: [{ userId: "student-1", user: { role: "STUDENT" } }],
    },
    existingParticipants: [
      { userId: "leader-1" },
      { userId: "doctor-1" },
    ],
  });

  await syncTeamGroupConversationForTeam("team-1", tx);

  assert.deepEqual(calls.createManyParticipants[0].data, [
    { conversationId: "conversation-1", userId: "student-1" },
  ]);
  assert.deepEqual(calls.deleteManyParticipants[0].where, {
    conversationId: "conversation-1",
    userId: { in: ["doctor-1"] },
  });
});

test("syncTeamGroupConversationForTeam skips missing teams", async () => {
  const { tx, calls } = createSyncTx({ team: null });

  const conversationId = await syncTeamGroupConversationForTeam("missing-team", tx);

  assert.equal(conversationId, null);
  assert.equal(calls.upsertConversation.length, 0);
});

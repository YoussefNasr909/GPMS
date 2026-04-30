import test from "node:test";
import assert from "node:assert/strict";
import { commitFileSchema, createBranchSchema, deleteRepositorySchema, disconnectRepositorySchema } from "./github.schema.js";

test("commitFileSchema accepts expectedHeadSha for safe writes", () => {
  const parsed = commitFileSchema.parse({
    body: {
      branch: "feature/upload",
      expectedHeadSha: "a1b2c3d4e5f6",
      message: "Update file safely",
      changes: [{ action: "update", path: "src/app.js", content: "console.log('ok')" }],
    },
    params: {},
    query: {},
  });

  assert.equal(parsed.body.expectedHeadSha, "a1b2c3d4e5f6");
});

test("commitFileSchema rejects more than 20 changes", () => {
  const changes = Array.from({ length: 21 }, (_, index) => ({
    action: "create",
    path: `docs/file-${index}.md`,
    content: `content-${index}`,
  }));

  assert.throws(() => {
    commitFileSchema.parse({
      body: {
        branch: "feature/too-many",
        message: "Attempt oversized commit",
        changes,
      },
      params: {},
      query: {},
    });
  });
});

test("createBranchSchema accepts empty-start branches", () => {
  const parsed = createBranchSchema.parse({
    body: {
      name: "sandbox/empty-start",
      startEmpty: true,
    },
    params: {},
    query: {},
  });

  assert.equal(parsed.body.startEmpty, true);
});

test("deleteRepositorySchema requires confirmation text", () => {
  const parsed = deleteRepositorySchema.parse({
    body: {
      confirmationText: "owner/repo",
    },
    params: {},
    query: {},
  });

  assert.equal(parsed.body.confirmationText, "owner/repo");
});

test("disconnectRepositorySchema requires confirmation text", () => {
  const parsed = disconnectRepositorySchema.parse({
    body: {
      confirmationText: "DISCONNECT",
    },
    params: {},
    query: {},
  });

  assert.equal(parsed.body.confirmationText, "DISCONNECT");
});

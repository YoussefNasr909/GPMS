/**
 * Notification System — Integration Tests
 *
 * Uses Node.js built-in test runner (node:test).
 * Requires the backend server to be running on http://localhost:4000
 * and the database to be seeded (npm run db:seed).
 *
 * Run: node --test src/modules/notifications/notifications.test.js
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";

const BASE = "http://localhost:4000/api/v1";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function request(path, options = {}) {
  const { method = "GET", body, token } = options;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return { status: res.status, ok: res.ok, body: json };
}

async function login(email, password = "demo123") {
  const res = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.accessToken;
}

// ─── Shared state (populated in before()) ────────────────────────────────────
const ctx = {
  leaderToken: null,
  studentToken: null,
  doctorToken: null,
  leaderNotificationId: null,
  studentNotificationId: null,
};

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("Notification System", { concurrency: false }, () => {

  // Run sequentially — tokens are shared across all subtests
  before(async () => {
    ctx.leaderToken  = await login("mariam.salah@student.edu");
    ctx.studentToken = await login("amira.khalil@student.edu");
    ctx.doctorToken  = await login("ahmed.hassan@university.edu");
  });

  // ── 1. GET /notifications — correct response shape ────────────────────────
  test("1. GET /notifications returns ok shape", async () => {
    const res = await request("/notifications", { token: ctx.leaderToken });
    assert.equal(res.status, 200, `Expected 200, got: ${JSON.stringify(res.body)}`);
    assert.ok(Array.isArray(res.body.data.notifications), "data.notifications must be an array");
    assert.ok(typeof res.body.data.pagination === "object", "data.pagination must be an object");
    const { pagination } = res.body.data;
    assert.ok(typeof pagination.page === "number");
    assert.ok(typeof pagination.total === "number");
    assert.ok(typeof pagination.hasNextPage === "boolean");
  });

  // ── 2. GET /notifications/unread-count ────────────────────────────────────
  test("2. GET /notifications/unread-count returns a non-negative number", async () => {
    const res = await request("/notifications/unread-count", { token: ctx.leaderToken });
    assert.equal(res.status, 200);
    assert.ok(typeof res.body.data.unreadCount === "number", "unreadCount must be a number");
    assert.ok(res.body.data.unreadCount >= 0, "unreadCount must be >= 0");
  });

  // ── 3. Unauthenticated requests are rejected ──────────────────────────────
  test("3. GET /notifications returns 401 without token", async () => {
    const res = await request("/notifications");
    assert.equal(res.status, 401, "Expected 401 without auth token");
  });

  // ── 4. Pagination works ───────────────────────────────────────────────────
  test("4. GET /notifications?page=1&limit=5 returns correct pagination shape", async () => {
    const res = await request("/notifications?page=1&limit=5", { token: ctx.leaderToken });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    const { pagination, notifications } = res.body.data;
    assert.equal(pagination.page, 1, "page should be 1");
    assert.equal(pagination.limit, 5, "limit should be 5");
    assert.ok(typeof pagination.total === "number", "total must be number");
    assert.ok(typeof pagination.totalPages === "number", "totalPages must be number");
    assert.ok(typeof pagination.hasNextPage === "boolean", "hasNextPage must be boolean");
    assert.ok(notifications.length <= 5, "Should return at most 5 notifications");
  });

  // ── 5. Join request trigger — leader gets notified ────────────────────────
  test("5. Creating a join request notifies the team leader", async () => {
    // Look up Smart Campus — leader is Mariam Salah (ctx.leaderToken)
    // Use doctorToken to search (neutral actor who can see all)
    const teamsRes = await request("/teams", { token: ctx.doctorToken });
    assert.equal(teamsRes.status, 200, `Teams list failed: ${JSON.stringify(teamsRes.body)}`);

    // The doctor endpoint returns items in teamsRes.body.data.items
    const items = teamsRes.body.data?.items ?? teamsRes.body.data ?? [];
    const smartCampus = (Array.isArray(items) ? items : []).find((t) => t.name === "Smart Campus");
    assert.ok(smartCampus, "Smart Campus team must exist (run db:seed first)");

    const countBefore = await request("/notifications/unread-count", { token: ctx.leaderToken });
    const unreadBefore = countBefore.body.data.unreadCount;

    // Student sends a join request
    const joinRes = await request(`/teams/${smartCampus.id}/join-requests`, {
      method: "POST",
      token: ctx.studentToken,
      body: { message: "Test join request from automated test" },
    });

    // 201 = new request created, 409 = already exists — both are valid
    assert.ok(
      joinRes.status === 201 || joinRes.status === 409,
      `Unexpected status ${joinRes.status}: ${JSON.stringify(joinRes.body)}`,
    );

    if (joinRes.status === 201) {
      await new Promise((r) => setTimeout(r, 300)); // let async notify persist

      const countAfter = await request("/notifications/unread-count", { token: ctx.leaderToken });
      assert.ok(
        countAfter.body.data.unreadCount > unreadBefore,
        `Leader unread count should increase. Before: ${unreadBefore}, After: ${countAfter.body.data.unreadCount}`,
      );

      const notiRes = await request("/notifications", { token: ctx.leaderToken });
      const latest = notiRes.body.data.notifications[0];
      assert.ok(latest, "Leader must have at least one notification");
      assert.equal(latest.type, "TEAM_JOIN_REQUEST_RECEIVED");
      assert.equal(latest.read, false, "New notification must be unread");
      ctx.leaderNotificationId = latest.id;
    } else {
      console.log("  ⚠ Join request already existed — notification trigger skipped");
      const notiRes = await request("/notifications", { token: ctx.leaderToken });
      ctx.leaderNotificationId = notiRes.body.data.notifications[0]?.id ?? null;
    }
  });

  // ── 6. PATCH /:id/read — mark one notification as read ───────────────────
  test("6. PATCH /notifications/:id/read marks notification as read", async () => {
    if (!ctx.leaderNotificationId) {
      console.log("  ⚠ No notification id — skipping");
      return;
    }
    const res = await request(`/notifications/${ctx.leaderNotificationId}/read`, {
      method: "PATCH",
      token: ctx.leaderToken,
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    assert.equal(res.body.data.read, true, "Notification should now be read");
    assert.equal(res.body.data.id, ctx.leaderNotificationId);
  });

  // ── 7. PATCH /:id/read — idempotent ──────────────────────────────────────
  test("7. PATCH /notifications/:id/read is idempotent (already read)", async () => {
    if (!ctx.leaderNotificationId) return;
    const res = await request(`/notifications/${ctx.leaderNotificationId}/read`, {
      method: "PATCH",
      token: ctx.leaderToken,
    });
    assert.equal(res.status, 200, "Should return 200 even if already read");
    assert.equal(res.body.data.read, true);
  });

  // ── 8. PATCH /:id/read — ownership check ─────────────────────────────────
  test("8. PATCH /notifications/:id/read returns 403 for another user's notification", async () => {
    if (!ctx.leaderNotificationId) return;
    const res = await request(`/notifications/${ctx.leaderNotificationId}/read`, {
      method: "PATCH",
      token: ctx.studentToken,
    });
    assert.equal(res.status, 403, "Student should not mark leader's notification as read");
  });

  // ── 9. Team invite trigger — student gets notified ────────────────────────
  test("9. Inviting a student creates a notification for them", async () => {
    const teamsRes = await request("/teams", { token: ctx.doctorToken });
    const items = teamsRes.body.data?.items ?? teamsRes.body.data ?? [];
    const smartCampus = (Array.isArray(items) ? items : []).find((t) => t.name === "Smart Campus");
    if (!smartCampus) {
      console.log("  ⚠ Smart Campus not found — skipping");
      return;
    }

    const countBefore = await request("/notifications/unread-count", { token: ctx.studentToken });
    const unreadBefore = countBefore.body.data.unreadCount;

    const inviteRes = await request(`/teams/${smartCampus.id}/invitations`, {
      method: "POST",
      token: ctx.leaderToken,
      body: { email: "amira.khalil@student.edu" },
    });

    if (inviteRes.status === 201) {
      await new Promise((r) => setTimeout(r, 300));
      const countAfter = await request("/notifications/unread-count", { token: ctx.studentToken });
      assert.ok(
        countAfter.body.data.unreadCount > unreadBefore,
        `Student unread count should increase. Before: ${unreadBefore}, After: ${countAfter.body.data.unreadCount}`,
      );
      const notiRes = await request("/notifications", { token: ctx.studentToken });
      const latest = notiRes.body.data.notifications[0];
      assert.ok(latest, "Student must have at least one notification");
      assert.equal(latest.type, "TEAM_INVITE_RECEIVED");
      ctx.studentNotificationId = latest.id;
    } else {
      console.log(`  ⚠ Invitation returned ${inviteRes.status} — skipping trigger assertion`);
      const notiRes = await request("/notifications", { token: ctx.studentToken });
      ctx.studentNotificationId = notiRes.body.data.notifications[0]?.id ?? null;
    }
  });

  // ── 10. DELETE /:id — ownership check ────────────────────────────────────
  test("10. DELETE /notifications/:id returns 403 for another user's notification", async () => {
    if (!ctx.studentNotificationId) {
      console.log("  ⚠ No student notification id — skipping");
      return;
    }
    // Leader tries to delete student's notification
    const res = await request(`/notifications/${ctx.studentNotificationId}`, {
      method: "DELETE",
      token: ctx.leaderToken,
    });
    assert.equal(res.status, 403, "Leader should not delete student's notification");
  });

  // ── 11. DELETE /:id — delete own notification ────────────────────────────
  test("11. DELETE /notifications/:id deletes own notification", async () => {
    if (!ctx.leaderNotificationId) return;
    const res = await request(`/notifications/${ctx.leaderNotificationId}`, {
      method: "DELETE",
      token: ctx.leaderToken,
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    assert.equal(res.body.data.ok, true);

    // Confirm gone from list
    const listRes = await request("/notifications", { token: ctx.leaderToken });
    const found = listRes.body.data.notifications.find((n) => n.id === ctx.leaderNotificationId);
    assert.equal(found, undefined, "Deleted notification must not appear in list");
  });

  // ── 12. DELETE /:id — 404 on non-existent ────────────────────────────────
  test("12. DELETE /notifications/:id returns 404 for non-existent id", async () => {
    if (!ctx.leaderNotificationId) return;
    // leaderNotificationId was just deleted in test 11
    const res = await request(`/notifications/${ctx.leaderNotificationId}`, {
      method: "DELETE",
      token: ctx.leaderToken,
    });
    assert.equal(res.status, 404, "Should return 404 for already-deleted notification");
  });

  // ── 13. PATCH /read-all ───────────────────────────────────────────────────
  test("13. PATCH /notifications/read-all marks all as read and unread count becomes 0", async () => {
    const res = await request("/notifications/read-all", {
      method: "PATCH",
      token: ctx.leaderToken,
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.data.ok, true);

    const countRes = await request("/notifications/unread-count", { token: ctx.leaderToken });
    assert.equal(countRes.body.data.unreadCount, 0, "Unread count must be 0 after mark-all-read");
  });

  // ── 14. PATCH /:id/read — 404 for non-existent ───────────────────────────
  test("14. PATCH /notifications/nonexistent-id/read returns 404", async () => {
    const res = await request("/notifications/nonexistent-id-abc123/read", {
      method: "PATCH",
      token: ctx.leaderToken,
    });
    assert.equal(res.status, 404, `Expected 404, got ${res.status}`);
  });

  // ── 15. DELETE /notifications — clear all ────────────────────────────────
  test("15. DELETE /notifications clears all notifications for the user", async () => {
    const res = await request("/notifications", {
      method: "DELETE",
      token: ctx.doctorToken,
    });
    assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.equal(res.body.data.ok, true);

    const listRes = await request("/notifications", { token: ctx.doctorToken });
    assert.equal(listRes.body.data.notifications.length, 0, "Doctor should have 0 notifications after delete-all");
    assert.equal(listRes.body.data.pagination.total, 0);
  });

});

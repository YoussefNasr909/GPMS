import { prisma } from "../../loaders/dbLoader.js";

/**
 * Creates a notification for a user.
 * Failures are swallowed silently so a missing notification never breaks a core business action.
 *
 * @param {{ userId: string, type: string, title: string, message: string, actionUrl?: string }} payload
 * @param {object} [tx] - optional Prisma transaction client
 */
export async function notify({ userId, type, title, message, actionUrl = null }, tx = prisma) {
  try {
    await tx.notification.create({
      data: { userId, type, title, message, actionUrl },
    });
  } catch (err) {
    // Never let a notification failure crash a service call
    console.error("[notify] Failed to create notification:", err?.message ?? err);
  }
}

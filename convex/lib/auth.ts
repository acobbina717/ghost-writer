import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";

/**
 * Shared authentication helper for Convex functions.
 * Validates the user is authenticated and has the required role.
 * 
 * @param ctx - The Convex query or mutation context
 * @param minRole - Minimum required role: 'team' or 'admin'
 * @returns The authenticated user document
 * @throws Error if unauthorized or insufficient permissions
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
  minRole: "team" | "admin" = "team"
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user || user.role === "pending") {
    throw new Error("Team access required");
  }

  if (minRole === "admin" && user.role !== "admin") {
    throw new Error("Admin access required");
  }

  return user;
}

// =============================================================================
// AUDIT LOG HELPER
// =============================================================================

type AuditAction =
  | "user_onboarding_complete"
  | "user_approved"
  | "user_denied"
  | "user_demoted"
  | "client_created"
  | "client_updated"
  | "client_deleted"
  | "letter_created"
  | "letter_updated"
  | "letter_deleted"
  | "letter_generated";

type EntityType = "user" | "client" | "letter" | "disputeItem" | "generation_log";

interface AuditLogParams {
  action: AuditAction;
  user: Doc<"users">;
  entityType: EntityType;
  entityId: Id<"users"> | Id<"clients"> | Id<"letters"> | Id<"disputeItems"> | Id<"generationLogs">;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Creates an audit log entry.
 * Use this helper to maintain consistent audit logging across mutations.
 * 
 * @param ctx - The Convex mutation context
 * @param params - Audit log parameters
 */
export async function createAuditLog(
  ctx: MutationCtx,
  { action, user, entityType, entityId, metadata = {} }: AuditLogParams
) {
  await ctx.db.insert("auditLogs", {
    action,
    userId: user._id,
    userEmail: user.email,
    entityType,
    entityId,
    metadata,
    createdAt: Date.now(),
  });
}


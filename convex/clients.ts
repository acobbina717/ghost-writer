import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import { DISPUTE_TYPES, VALID_CRA_TARGETS, VALID_US_STATES, PURGE_WARNING_DAYS, PURGE_DANGER_DAYS, getSchemaGroupForType, getValidFieldKeys } from "./constants";
import { Doc, Id } from "./_generated/dataModel";

// =============================================================================
// VALIDATION
// =============================================================================

function validateClientFields(args: {
  email: string;
  phone: string;
  state: string;
  zipCode: string;
  last4SSN: string;
  dateOfBirth?: string;
}) {
  if (!/^\d{4}$/.test(args.last4SSN)) {
    throw new Error("last4SSN must be exactly 4 digits");
  }
  if (!/^\d{5}$/.test(args.zipCode)) {
    throw new Error("zipCode must be exactly 5 digits");
  }
  if (!(VALID_US_STATES as readonly string[]).includes(args.state)) {
    throw new Error("Invalid state code");
  }
  // Stricter email validation: user@domain.tld, min 2-char TLD, no consecutive dots
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/.test(args.email)) {
    throw new Error("Invalid email format");
  }
  if (!/^\+?[\d\s()-]{7,20}$/.test(args.phone)) {
    throw new Error("Invalid phone number format");
  }
  if (args.dateOfBirth !== undefined && args.dateOfBirth !== '') {
    if (!/^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/.test(args.dateOfBirth)) {
      throw new Error("dateOfBirth must be in MM/DD/YYYY format");
    }
  }
}

// =============================================================================
// ACCESS CONTROL HELPER
// =============================================================================

/** Check row-level access: admin can access any client, team members only their own. */
async function requireClientAccess(
  ctx: QueryCtx | MutationCtx,
  user: Doc<"users">,
  clientId: string
): Promise<Doc<"clients">> {
  const client = await ctx.db.get(clientId as Id<"clients">);
  if (!client) throw new Error("Client not found");
  if (user.role !== "admin" && client.userId !== user._id) {
    throw new Error("Access denied");
  }
  return client;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateDaysActive(createdAt: number): number {
  const now = Date.now();
  return Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
}

function getAlertLevel(daysActive: number): "none" | "warning" | "danger" {
  if (daysActive >= PURGE_DANGER_DAYS) return "danger";
  if (daysActive >= PURGE_WARNING_DAYS) return "warning";
  return "none";
}

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all clients for the current user with dispute counts.
 * Row-level security: Team members only see their own clients.
 *
 * TODO(perf): N+1 query pattern — fetches disputes per client.
 * Acceptable at < 100 clients per user. Consider denormalized counts if volume grows.
 */
export const getClientsWithDisputes = query({
  handler: async (ctx) => {
    const currentUser = await requireAuth(ctx, "team");

    // Get clients based on role
    let clients;
    if (currentUser.role === "admin") {
      clients = await ctx.db.query("clients").collect();
    } else {
      clients = await ctx.db
        .query("clients")
        .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
        .collect();
    }

    // Fetch dispute counts per client (parallel indexed queries)
    const clientsWithDisputes = await Promise.all(
      clients.map(async (client) => {
        const disputes = await ctx.db
          .query("disputeItems")
          .withIndex("by_client", (q) => q.eq("clientId", client._id))
          .collect();

        const daysActive = calculateDaysActive(client.createdAt);

        // Most recent updatedAt across all dispute items (null if none)
        const lastDisputeUpdatedAt = disputes.length > 0
          ? Math.max(...disputes.map((d) => d.updatedAt))
          : null;

        return {
          ...client,
          daysActive,
          totalDisputes: disputes.length,
          pendingDisputes: disputes.filter((d) => d.status === "pending").length,
          alertLevel: getAlertLevel(daysActive),
          lastDisputeUpdatedAt,
        };
      })
    );

    return clientsWithDisputes;
  },
});

/**
 * Get a single client by ID
 */
export const getClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");

    const client = await ctx.db.get(args.clientId);
    if (!client) return null;

    if (currentUser.role !== "admin" && client.userId !== currentUser._id) {
      throw new Error("Access denied");
    }

    return client;
  },
});

/**
 * Get dispute items for a specific client
 */
export const getDisputeItemsByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");
    await requireClientAccess(ctx, currentUser, args.clientId);

    const disputes = await ctx.db
      .query("disputeItems")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();

    return disputes;
  },
});

/**
 * Get summary stats for the dashboard.
 *
 * TODO(perf): N+1 query pattern — fetches disputes per client.
 * Same scaling note as getClientsWithDisputes.
 */
export const getClientStats = query({
  handler: async (ctx) => {
    const currentUser = await requireAuth(ctx, "team");
    
    let clients;
    if (currentUser.role === "admin") {
      clients = await ctx.db.query("clients").collect();
    } else {
      clients = await ctx.db
        .query("clients")
        .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
        .collect();
    }

    let pendingItems = 0;
    let approachingPurge = 0;
    let totalRemoved = 0;
    let totalResolved = 0;

    for (const client of clients) {
      const disputes = await ctx.db
        .query("disputeItems")
        .withIndex("by_client", (q) => q.eq("clientId", client._id))
        .collect();

      pendingItems += disputes.filter((d) => d.status === "pending").length;
      totalRemoved += disputes.filter((d) => d.status === "removed").length;
      totalResolved += disputes.filter((d) => d.status !== "pending").length;
      
      const daysActive = calculateDaysActive(client.createdAt);
      if (getAlertLevel(daysActive) !== "none") {
        approachingPurge++;
      }
    }

    const portfolioSuccessRate = totalResolved > 0
      ? Math.round((totalRemoved / totalResolved) * 100)
      : null;

    return {
      totalClients: clients.length,
      pendingItems,
      approachingPurge,
      portfolioSuccessRate,
    };
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new client
 */
export const createClient = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    address1: v.string(),
    address2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    last4SSN: v.string(),
    dateOfBirth: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");
    validateClientFields(args);

    const clientId = await ctx.db.insert("clients", {
      ...args,
      userId: currentUser._id,
      createdAt: Date.now(),
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "client_created",
      userId: currentUser._id,
      userEmail: currentUser.email,
      entityType: "client",
      entityId: clientId,
      metadata: {
        clientName: `${args.firstName} ${args.lastName}`,
      },
      createdAt: Date.now(),
    });

    return await ctx.db.get(clientId);
  },
});

/**
 * Update an existing client
 */
export const updateClient = mutation({
  args: {
    id: v.id("clients"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    address1: v.string(),
    address2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    last4SSN: v.string(),
    dateOfBirth: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");
    validateClientFields(args);
    const { id, ...updates } = args;

    const existingClient = await requireClientAccess(ctx, currentUser, id);

    await ctx.db.patch(id, updates);

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "client_updated",
      userId: currentUser._id,
      userEmail: currentUser.email,
      entityType: "client",
      entityId: id,
      metadata: {
        clientName: `${args.firstName} ${args.lastName}`,
        previousName: `${existingClient.firstName} ${existingClient.lastName}`,
      },
      createdAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

/**
 * Delete a client (manual cascade to disputeItems and generationLogs)
 */
export const deleteClient = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");
    const existingClient = await requireClientAccess(ctx, currentUser, args.clientId);

    // Get dispute items for audit log
    const disputes = await ctx.db
      .query("disputeItems")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Log the action BEFORE deletion
    await ctx.db.insert("auditLogs", {
      action: "client_deleted",
      userId: currentUser._id,
      userEmail: currentUser.email,
      entityType: "client",
      entityId: args.clientId,
      metadata: {
        clientName: `${existingClient.firstName} ${existingClient.lastName}`,
        disputeItemsDeleted: disputes.length,
      },
      createdAt: Date.now(),
    });

    // Manual cascade: delete dispute items
    for (const dispute of disputes) {
      await ctx.db.delete(dispute._id);
    }

    // Manual cascade: delete generation logs
    const genLogs = await ctx.db
      .query("generationLogs")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const log of genLogs) {
      await ctx.db.delete(log._id);
    }

    // Delete the client
    await ctx.db.delete(args.clientId);

    return { success: true };
  },
});

// =============================================================================
// DISPUTE ITEM MUTATIONS
// =============================================================================

/**
 * Create a dispute item for a client
 */
export const createDisputeItem = mutation({
  args: {
    clientId: v.id("clients"),
    disputeType: v.string(),
    creditorName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    craTarget: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");

    if (!(DISPUTE_TYPES as readonly string[]).includes(args.disputeType)) {
      throw new Error("Invalid dispute type");
    }
    if (!(VALID_CRA_TARGETS as readonly string[]).includes(args.craTarget)) {
      throw new Error("Invalid CRA target");
    }

    await requireClientAccess(ctx, currentUser, args.clientId);

    const now = Date.now();
    const disputeId = await ctx.db.insert("disputeItems", {
      ...args,
      currentRound: 1,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(disputeId);
  },
});

/**
 * Batch create dispute items (replaces N individual mutations with 1)
 * Validates fields against the dispute type's schema group.
 */
export const createDisputeItems = mutation({
  args: {
    clientId: v.id("clients"),
    items: v.array(v.object({
      disputeType: v.string(),
      craTarget: v.string(),
      creditorName: v.string(),
      accountNumber: v.optional(v.string()),
      inquiryDate: v.optional(v.string()),
      dateOpened: v.optional(v.string()),
      balance: v.optional(v.string()),
      monthsLate: v.optional(v.string()),
      monthLate: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");
    await requireClientAccess(ctx, currentUser, args.clientId);

    if (args.items.length === 0) throw new Error("No items to create");
    if (args.items.length > 100) throw new Error("Cannot create more than 100 items at once");

    for (const item of args.items) {
      if (!(DISPUTE_TYPES as readonly string[]).includes(item.disputeType)) {
        throw new Error(`Invalid dispute type: ${item.disputeType}`);
      }
      if (!(VALID_CRA_TARGETS as readonly string[]).includes(item.craTarget)) {
        throw new Error(`Invalid CRA target: ${item.craTarget}`);
      }

      // Validate required fields based on schema group
      const schema = getSchemaGroupForType(item.disputeType);
      if (schema) {
        for (const field of schema.fields) {
          if (field.required) {
            const value = item[field.key as keyof typeof item];
            if (!value || (typeof value === 'string' && !value.trim())) {
              throw new Error(`${field.label} is required for ${item.disputeType} disputes`);
            }
          }
        }

        // Validate monthsLate values if present
        if (item.monthsLate && !['30', '60', '90', '120'].includes(item.monthsLate)) {
          throw new Error("monthsLate must be 30, 60, 90, or 120");
        }
      }
    }

    const now = Date.now();
    const validFieldKeys = new Set(['creditorName', 'accountNumber', 'inquiryDate', 'dateOpened', 'balance', 'monthsLate', 'monthLate']);
    const results: { id: string; craTarget: string }[] = [];

    for (const item of args.items) {
      const allowedKeys = getValidFieldKeys(item.disputeType);

      // Build the document with only schema-valid fields
      const doc: Record<string, unknown> = {
        clientId: args.clientId,
        disputeType: item.disputeType,
        craTarget: item.craTarget,
        currentRound: 1,
        status: "pending" as const,
        createdAt: now,
        updatedAt: now,
      };

      for (const key of allowedKeys) {
        if (validFieldKeys.has(key)) {
          const val = item[key as keyof typeof item];
          if (val && typeof val === 'string' && val.trim()) {
            doc[key] = val.trim();
          }
        }
      }

      const id = await ctx.db.insert("disputeItems", doc as never);
      results.push({ id, craTarget: item.craTarget });
    }

    return results;
  },
});

/**
 * Update dispute item fields (schema-group validated)
 */
export const updateDisputeItem = mutation({
  args: {
    disputeId: v.id("disputeItems"),
    creditorName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    inquiryDate: v.optional(v.string()),
    dateOpened: v.optional(v.string()),
    balance: v.optional(v.string()),
    monthsLate: v.optional(v.string()),
    monthLate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute item not found");

    await requireClientAccess(ctx, currentUser, dispute.clientId);

    const allowedKeys = getValidFieldKeys(dispute.disputeType);
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    const editableFields = ['creditorName', 'accountNumber', 'inquiryDate', 'dateOpened', 'balance', 'monthsLate', 'monthLate'] as const;

    for (const key of editableFields) {
      if (args[key] !== undefined && allowedKeys.includes(key)) {
        updates[key] = args[key]?.trim() || undefined;
      }
    }

    if (args.monthsLate !== undefined && args.monthsLate && !['30', '60', '90', '120'].includes(args.monthsLate)) {
      throw new Error("monthsLate must be 30, 60, 90, or 120");
    }

    await ctx.db.patch(args.disputeId, updates);
    return await ctx.db.get(args.disputeId);
  },
});

/**
 * Bulk update dispute item statuses
 */
export const bulkUpdateDisputeStatus = mutation({
  args: {
    disputeIds: v.array(v.id("disputeItems")),
    status: v.union(v.literal("pending"), v.literal("removed"), v.literal("verified"), v.literal("no_change")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");

    if (args.disputeIds.length === 0) throw new Error("No items selected");

    // Validate ALL items and access before applying any changes
    const disputes = [];
    for (const disputeId of args.disputeIds) {
      const dispute = await ctx.db.get(disputeId);
      if (!dispute) throw new Error(`Dispute item ${disputeId} not found`);
      await requireClientAccess(ctx, currentUser, dispute.clientId);
      disputes.push({ disputeId, dispute });
    }

    // Apply changes only after all validation passes
    const now = Date.now();
    let updatedCount = 0;
    for (const { disputeId } of disputes) {
      await ctx.db.patch(disputeId, { status: args.status, updatedAt: now });
      updatedCount++;
    }

    return updatedCount;
  },
});

/**
 * Update dispute item status
 */
export const updateDisputeStatus = mutation({
  args: {
    disputeId: v.id("disputeItems"),
    status: v.union(v.literal("pending"), v.literal("removed"), v.literal("verified"), v.literal("no_change")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute item not found");

    await requireClientAccess(ctx, currentUser, dispute.clientId);

    await ctx.db.patch(args.disputeId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.disputeId);
  },
});

/**
 * Increment dispute round
 */
export const incrementDisputeRound = mutation({
  args: { disputeId: v.id("disputeItems") },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute item not found");

    await requireClientAccess(ctx, currentUser, dispute.clientId);

    if (dispute.currentRound >= 10) {
      throw new Error("Maximum round limit (10) reached");
    }

    await ctx.db.patch(args.disputeId, {
      currentRound: dispute.currentRound + 1,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.disputeId);
  },
});


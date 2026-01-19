import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

// Constants
// TODO: When PURGE_ENABLED is true in frontend, implement convex/crons.ts
// to automate actual purging. Backend continues to calculate alert levels
// for data integrity, but frontend controls warning display via feature flag.
const PURGE_WARNING_DAYS = 80;
const PURGE_DANGER_DAYS = 85;

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
 * Get all clients for the current user with dispute counts
 * Row-level security: Team members only see their own clients
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

    // Get all dispute items for these clients
    const clientsWithDisputes = await Promise.all(
      clients.map(async (client) => {
        const disputes = await ctx.db
          .query("disputeItems")
          .withIndex("by_client", (q) => q.eq("clientId", client._id))
          .collect();

        const daysActive = calculateDaysActive(client.createdAt);

        return {
          ...client,
          daysActive,
          totalDisputes: disputes.length,
          pendingDisputes: disputes.filter((d) => d.status === "pending").length,
          alertLevel: getAlertLevel(daysActive),
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

    // Row-level security for non-admins
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

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Row-level security for non-admins
    if (currentUser.role !== "admin" && client.userId !== currentUser._id) {
      throw new Error("Access denied");
    }

    const disputes = await ctx.db
      .query("disputeItems")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();

    return disputes;
  },
});

/**
 * Get summary stats for the dashboard
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

    for (const client of clients) {
      const disputes = await ctx.db
        .query("disputeItems")
        .withIndex("by_client", (q) => q.eq("clientId", client._id))
        .collect();

      pendingItems += disputes.filter((d) => d.status === "pending").length;
      
      const daysActive = calculateDaysActive(client.createdAt);
      if (getAlertLevel(daysActive) !== "none") {
        approachingPurge++;
      }
    }

    return {
      totalClients: clients.length,
      pendingItems,
      approachingPurge,
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
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");

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
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");
    const { id, ...updates } = args;

    const existingClient = await ctx.db.get(id);
    if (!existingClient) throw new Error("Client not found");

    // Row-level security for non-admins
    if (currentUser.role !== "admin" && existingClient.userId !== currentUser._id) {
      throw new Error("Access denied");
    }

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

    const existingClient = await ctx.db.get(args.clientId);
    if (!existingClient) throw new Error("Client not found");

    // Row-level security for non-admins
    if (currentUser.role !== "admin" && existingClient.userId !== currentUser._id) {
      throw new Error("Access denied");
    }

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

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Row-level security for non-admins
    if (currentUser.role !== "admin" && client.userId !== currentUser._id) {
      throw new Error("Access denied");
    }

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
 * Update dispute item status
 */
export const updateDisputeStatus = mutation({
  args: {
    disputeId: v.id("disputeItems"),
    status: v.union(v.literal("pending"), v.literal("removed"), v.literal("verified")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");

    const dispute = await ctx.db.get(args.disputeId);
    if (!dispute) throw new Error("Dispute item not found");

    const client = await ctx.db.get(dispute.clientId);
    if (!client) throw new Error("Client not found");

    // Row-level security for non-admins
    if (currentUser.role !== "admin" && client.userId !== currentUser._id) {
      throw new Error("Access denied");
    }

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

    const client = await ctx.db.get(dispute.clientId);
    if (!client) throw new Error("Client not found");

    // Row-level security for non-admins
    if (currentUser.role !== "admin" && client.userId !== currentUser._id) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(args.disputeId, {
      currentRound: dispute.currentRound + 1,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.disputeId);
  },
});


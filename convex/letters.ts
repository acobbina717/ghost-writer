import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, createAuditLog } from "./lib/auth";
import { DISPUTE_TYPES, VALID_CRA_TARGETS, areTypesCompatible } from "./constants";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all letters
 */
export const getLetters = query({
  handler: async (ctx) => {
    await requireAuth(ctx, "team");

    const allLetters = await ctx.db
      .query("letters")
      .order("desc")
      .collect();

    return allLetters;
  },
});

/**
 * Get a single letter by ID
 */
export const getLetter = query({
  args: { id: v.id("letters") },
  handler: async (ctx, args) => {
    await requireAuth(ctx, "team");

    const letter = await ctx.db.get(args.id);
    if (!letter) throw new Error("Letter not found");

    return letter;
  },
});

/**
 * Get per-template success rate and usage count (team-accessible).
 * Lighter than getLetterAnalytics — returns only what the template
 * selection cards need to display intelligence data.
 *
 * TODO(perf): N+1+M query pattern — fetches logs per letter, then disputes per log.
 * Acceptable at < 50 letters and < 1000 logs. Consider pre-aggregated stats table
 * if template count or log volume grows significantly.
 */
export const getTemplateStats = query({
  handler: async (ctx) => {
    await requireAuth(ctx, "team");

    const allLetters = await ctx.db.query("letters").collect();

    const stats: Record<string, { successRate: number | null; usageCount: number }> = {};

    for (const letter of allLetters) {
      const logs = await ctx.db
        .query("generationLogs")
        .withIndex("by_letter", (q) => q.eq("letterId", letter._id))
        .collect();

      let successRate: number | null = null;

      if (logs.length > 0) {
        const disputeIds = [...new Set(logs.flatMap((log) => log.disputeItemIds))];
        if (disputeIds.length > 0) {
          const disputes = await Promise.all(
            disputeIds.map((id) => ctx.db.get(id))
          );
          const resolved = disputes.filter(Boolean).filter((d) => d!.status !== "pending");
          const removed = resolved.filter((d) => d!.status === "removed");

          if (resolved.length > 0) {
            successRate = Math.round((removed.length / resolved.length) * 100);
          }
        }
      }

      stats[letter._id] = {
        successRate,
        usageCount: logs.length,
      };
    }

    return stats;
  },
});

/**
 * Get letter analytics with usage statistics (admin only)
 */
export const getLetterAnalytics = query({
  handler: async (ctx) => {
    await requireAuth(ctx, "admin");

    const allLetters = await ctx.db.query("letters").collect();

    // Query generation logs per letter using the by_letter index
    const analytics = await Promise.all(
      allLetters.map(async (letter) => {
        const letterLogs = await ctx.db
          .query("generationLogs")
          .withIndex("by_letter", (q) => q.eq("letterId", letter._id))
          .collect();

        const uniqueUserIds = new Set(letterLogs.map((log) => log.userId));

        // Collect unique dispute item IDs and fetch only those
        const letterDisputeIds = letterLogs.flatMap((log) => log.disputeItemIds);
        const uniqueDisputeIds = [...new Set(letterDisputeIds)];

        let successRate: number | null = null;
        const perCraStats: Record<string, { removed: number; resolved: number; rate: number | null }> = {};

        if (uniqueDisputeIds.length > 0) {
          const disputes = await Promise.all(
            uniqueDisputeIds.map((id) => ctx.db.get(id))
          );
          const validDisputes = disputes.filter(Boolean).map((d) => d!);
          const itemsWithOutcome = validDisputes.filter((d) => d.status !== "pending");
          const removedItems = validDisputes.filter((d) => d.status === "removed");

          if (itemsWithOutcome.length > 0) {
            successRate = Math.round(
              (removedItems.length / itemsWithOutcome.length) * 100
            );
          }

          for (const d of validDisputes) {
            const cra = d.craTarget;
            if (!perCraStats[cra]) {
              perCraStats[cra] = { removed: 0, resolved: 0, rate: null };
            }
            if (d.status !== "pending") {
              perCraStats[cra].resolved++;
              if (d.status === "removed") {
                perCraStats[cra].removed++;
              }
            }
          }

          for (const cra of Object.keys(perCraStats)) {
            const s = perCraStats[cra];
            s.rate = s.resolved > 0
              ? Math.round((s.removed / s.resolved) * 100)
              : null;
          }
        }

        const lastUsed = letterLogs.length > 0
          ? Math.max(...letterLogs.map((log) => log.createdAt))
          : null;

        return {
          id: letter._id,
          title: letter.title,
          totalDownloads: letterLogs.length,
          uniqueUsers: uniqueUserIds.size,
          successRate,
          perCraStats,
          lastUsed,
        };
      })
    );

    return analytics;
  },
});

/**
 * Get summary stats for admin dashboard
 */
export const getLetterStats = query({
  handler: async (ctx) => {
    await requireAuth(ctx, "admin");

    const allLetters = await ctx.db.query("letters").collect();
    const totalLetters = allLetters.length;

    // Get downloads this month using the by_created_at index
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthTimestamp = startOfMonth.getTime();

    const monthlyLogs = await ctx.db
      .query("generationLogs")
      .withIndex("by_created_at", (q) => q.gte("createdAt", startOfMonthTimestamp))
      .collect();
    const totalDownloadsThisMonth = monthlyLogs.length;

    // Calculate average success rate per letter using indexed queries
    let totalSuccess = 0;
    let lettersWithRate = 0;

    for (const letter of allLetters) {
      const letterLogs = await ctx.db
        .query("generationLogs")
        .withIndex("by_letter", (q) => q.eq("letterId", letter._id))
        .collect();

      const letterDisputeIds = [...new Set(letterLogs.flatMap((log) => log.disputeItemIds))];

      if (letterDisputeIds.length > 0) {
        const disputes = await Promise.all(
          letterDisputeIds.map((id) => ctx.db.get(id))
        );
        const statuses = disputes.filter(Boolean).map((d) => d!.status);
        const itemsWithOutcome = statuses.filter((s) => s !== "pending");
        const removedItems = statuses.filter((s) => s === "removed");

        if (itemsWithOutcome.length > 0) {
          totalSuccess += (removedItems.length / itemsWithOutcome.length) * 100;
          lettersWithRate++;
        }
      }
    }

    const avgSuccessRate = lettersWithRate > 0
      ? Math.round(totalSuccess / lettersWithRate)
      : null;

    return {
      totalLetters,
      totalDownloadsThisMonth,
      avgSuccessRate,
    };
  },
});

/**
 * Get dispute type performance — removal rates grouped by dispute type (admin only).
 *
 * TODO(perf): Collects ALL dispute items. Acceptable at < 10k items.
 * Consider adding a by_disputeType index or pre-aggregated stats if volume grows.
 */
export const getDisputeTypePerformance = query({
  handler: async (ctx) => {
    await requireAuth(ctx, "admin");

    const allDisputes = await ctx.db.query("disputeItems").collect();

    const byType: Record<string, { total: number; removed: number; resolved: number }> = {};

    for (const d of allDisputes) {
      if (!byType[d.disputeType]) {
        byType[d.disputeType] = { total: 0, removed: 0, resolved: 0 };
      }
      byType[d.disputeType].total++;
      if (d.status !== "pending") {
        byType[d.disputeType].resolved++;
        if (d.status === "removed") {
          byType[d.disputeType].removed++;
        }
      }
    }

    return Object.entries(byType)
      .map(([type, stats]) => ({
        disputeType: type,
        total: stats.total,
        removed: stats.removed,
        resolved: stats.resolved,
        rate: stats.resolved > 0
          ? Math.round((stats.removed / stats.resolved) * 100)
          : null,
      }))
      .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));
  },
});

/**
 * Get round-level success correlation — removal rates by round number (admin only).
 *
 * TODO(perf): Collects ALL dispute items. Same scaling note as getDisputeTypePerformance.
 */
export const getRoundPerformance = query({
  handler: async (ctx) => {
    await requireAuth(ctx, "admin");

    const allDisputes = await ctx.db.query("disputeItems").collect();

    const byRound: Record<number, { total: number; removed: number; resolved: number }> = {};

    for (const d of allDisputes) {
      const round = d.currentRound;
      if (!byRound[round]) {
        byRound[round] = { total: 0, removed: 0, resolved: 0 };
      }
      byRound[round].total++;
      if (d.status !== "pending") {
        byRound[round].resolved++;
        if (d.status === "removed") {
          byRound[round].removed++;
        }
      }
    }

    return Object.entries(byRound)
      .map(([round, stats]) => ({
        round: Number(round),
        total: stats.total,
        removed: stats.removed,
        resolved: stats.resolved,
        rate: stats.resolved > 0
          ? Math.round((stats.removed / stats.resolved) * 100)
          : null,
      }))
      .sort((a, b) => a.round - b.round);
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new letter template (admin only)
 */
export const createLetter = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    disputeTypes: v.array(v.string()),
    applicableCRAs: v.array(v.string()),
    maxDisputeItems: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "admin");

    if (args.disputeTypes.length === 0) {
      throw new Error("At least one dispute type is required");
    }
    for (const dt of args.disputeTypes) {
      if (!(DISPUTE_TYPES as readonly string[]).includes(dt)) {
        throw new Error(`Invalid dispute type: ${dt}`);
      }
    }
    if (!areTypesCompatible(args.disputeTypes)) {
      throw new Error("All dispute types must belong to the same schema group");
    }
    for (const cra of args.applicableCRAs) {
      if (!(VALID_CRA_TARGETS as readonly string[]).includes(cra)) {
        throw new Error(`Invalid CRA target: ${cra}`);
      }
    }
    if (args.maxDisputeItems !== undefined && args.maxDisputeItems < 1) {
      throw new Error("maxDisputeItems must be at least 1");
    }

    const now = Date.now();
    const letterId = await ctx.db.insert("letters", {
      title: args.title,
      content: args.content,
      disputeTypes: args.disputeTypes,
      applicableCRAs: args.applicableCRAs,
      maxDisputeItems: args.maxDisputeItems,
      createdAt: now,
      updatedAt: now,
    });

    await createAuditLog(ctx, {
      action: "letter_created",
      user: currentUser,
      entityType: "letter",
      entityId: letterId,
      metadata: {
        title: args.title,
        applicableCRAs: args.applicableCRAs.join(", "),
      },
    });

    return await ctx.db.get(letterId);
  },
});

/**
 * Update an existing letter template (admin only)
 */
export const updateLetter = mutation({
  args: {
    id: v.id("letters"),
    title: v.string(),
    content: v.string(),
    disputeTypes: v.array(v.string()),
    applicableCRAs: v.array(v.string()),
    maxDisputeItems: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "admin");

    if (args.disputeTypes.length === 0) {
      throw new Error("At least one dispute type is required");
    }
    for (const dt of args.disputeTypes) {
      if (!(DISPUTE_TYPES as readonly string[]).includes(dt)) {
        throw new Error(`Invalid dispute type: ${dt}`);
      }
    }
    if (!areTypesCompatible(args.disputeTypes)) {
      throw new Error("All dispute types must belong to the same schema group");
    }
    for (const cra of args.applicableCRAs) {
      if (!(VALID_CRA_TARGETS as readonly string[]).includes(cra)) {
        throw new Error(`Invalid CRA target: ${cra}`);
      }
    }
    if (args.maxDisputeItems !== undefined && args.maxDisputeItems < 1) {
      throw new Error("maxDisputeItems must be at least 1");
    }

    const { id, ...updates } = args;

    const existingLetter = await ctx.db.get(id);
    if (!existingLetter) throw new Error("Letter not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    await createAuditLog(ctx, {
      action: "letter_updated",
      user: currentUser,
      entityType: "letter",
      entityId: id,
      metadata: {
        title: args.title,
        previousTitle: existingLetter.title,
      },
    });

    return await ctx.db.get(id);
  },
});

/**
 * Delete a letter template (admin only)
 */
export const deleteLetter = mutation({
  args: { id: v.id("letters") },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "admin");

    const letterToDelete = await ctx.db.get(args.id);
    if (!letterToDelete) throw new Error("Letter not found");

    // Log the action BEFORE deletion
    await createAuditLog(ctx, {
      action: "letter_deleted",
      user: currentUser,
      entityType: "letter",
      entityId: args.id,
      metadata: {
        title: letterToDelete.title,
        applicableCRAs: letterToDelete.applicableCRAs.join(", "),
      },
    });

    // Delete the letter
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// =============================================================================
// GENERATION LOG MUTATIONS
// =============================================================================

/**
 * Log a letter generation (used when generating PDFs)
 */
export const logGeneration = mutation({
  args: {
    clientId: v.id("clients"),
    letterId: v.id("letters"),
    disputeItemIds: v.array(v.id("disputeItems")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");

    const logId = await ctx.db.insert("generationLogs", {
      clientId: args.clientId,
      userId: currentUser._id,
      letterId: args.letterId,
      disputeItemIds: args.disputeItemIds,
      status: "pending",
      createdAt: Date.now(),
    });

    await createAuditLog(ctx, {
      action: "letter_generated",
      user: currentUser,
      entityType: "generation_log",
      entityId: logId,
      metadata: {
        clientId: args.clientId,
        letterId: args.letterId,
        disputeItemCount: args.disputeItemIds.length,
      },
    });

    return await ctx.db.get(logId);
  },
});

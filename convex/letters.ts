import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";

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
 * Get letter analytics with usage statistics (admin only)
 */
export const getLetterAnalytics = query({
  handler: async (ctx) => {
    await requireAuth(ctx, "admin");

    const allLetters = await ctx.db.query("letters").collect();
    const allLogs = await ctx.db.query("generationLogs").collect();
    const allDisputeItems = await ctx.db.query("disputeItems").collect();

    // Build dispute status map
    const disputeStatusMap = new Map(
      allDisputeItems.map((item) => [item._id, item.status])
    );

    // Calculate analytics for each letter
    const analytics = allLetters.map((letter) => {
      const letterLogs = allLogs.filter((log) => log.letterId === letter._id);
      
      // Get unique users
      const uniqueUserIds = new Set(letterLogs.map((log) => log.userId));

      // Get all dispute item IDs from logs for this letter
      const letterDisputeIds = letterLogs.flatMap((log) => log.disputeItemIds);

      // Calculate success rate
      let successRate: number | null = null;
      if (letterDisputeIds.length > 0) {
        const statuses = letterDisputeIds
          .map((id) => disputeStatusMap.get(id))
          .filter(Boolean);
        const itemsWithOutcome = statuses.filter((s) => s !== "pending");
        const removedItems = statuses.filter((s) => s === "removed");

        if (itemsWithOutcome.length > 0) {
          successRate = Math.round(
            (removedItems.length / itemsWithOutcome.length) * 100
          );
        }
      }

      // Get last used date
      const lastUsed = letterLogs.length > 0
        ? Math.max(...letterLogs.map((log) => log.createdAt))
        : null;

      return {
        id: letter._id,
        title: letter.title,
        totalDownloads: letterLogs.length,
        uniqueUsers: uniqueUserIds.size,
        successRate,
        lastUsed,
      };
    });

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

    // Get downloads this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthTimestamp = startOfMonth.getTime();

    const allLogs = await ctx.db.query("generationLogs").collect();
    const monthlyLogs = allLogs.filter((log) => log.createdAt >= startOfMonthTimestamp);
    const totalDownloadsThisMonth = monthlyLogs.length;

    // Calculate average success rate
    const allDisputeItems = await ctx.db.query("disputeItems").collect();
    const disputeStatusMap = new Map(
      allDisputeItems.map((item) => [item._id, item.status])
    );

    let totalSuccess = 0;
    let lettersWithRate = 0;

    for (const letter of allLetters) {
      const letterLogs = allLogs.filter((log) => log.letterId === letter._id);
      const letterDisputeIds = letterLogs.flatMap((log) => log.disputeItemIds);

      if (letterDisputeIds.length > 0) {
        const statuses = letterDisputeIds
          .map((id) => disputeStatusMap.get(id))
          .filter(Boolean);
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
    applicableCRAs: v.array(v.string()),
    formSchema: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "admin");

    const now = Date.now();
    const letterId = await ctx.db.insert("letters", {
      title: args.title,
      content: args.content,
      applicableCRAs: args.applicableCRAs,
      formSchema: args.formSchema,
      createdAt: now,
      updatedAt: now,
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "letter_created",
      userId: currentUser._id,
      userEmail: currentUser.email,
      entityType: "letter",
      entityId: letterId,
      metadata: {
        title: args.title,
        applicableCRAs: args.applicableCRAs,
      },
      createdAt: now,
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
    applicableCRAs: v.array(v.string()),
    formSchema: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "admin");
    const { id, ...updates } = args;

    const existingLetter = await ctx.db.get(id);
    if (!existingLetter) throw new Error("Letter not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    // Log the action
    await ctx.db.insert("auditLogs", {
      action: "letter_updated",
      userId: currentUser._id,
      userEmail: currentUser.email,
      entityType: "letter",
      entityId: id,
      metadata: {
        title: args.title,
        previousTitle: existingLetter.title,
      },
      createdAt: Date.now(),
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
    await ctx.db.insert("auditLogs", {
      action: "letter_deleted",
      userId: currentUser._id,
      userEmail: currentUser.email,
      entityType: "letter",
      entityId: args.id,
      metadata: {
        title: letterToDelete.title,
        applicableCRAs: letterToDelete.applicableCRAs,
      },
      createdAt: Date.now(),
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
    formAnswers: v.any(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "team");

    const logId = await ctx.db.insert("generationLogs", {
      clientId: args.clientId,
      userId: currentUser._id,
      letterId: args.letterId,
      disputeItemIds: args.disputeItemIds,
      formAnswers: args.formAnswers,
      status: "pending",
      createdAt: Date.now(),
    });

    // Log to audit
    await ctx.db.insert("auditLogs", {
      action: "letter_generated",
      userId: currentUser._id,
      userEmail: currentUser.email,
      entityType: "generation_log",
      entityId: logId,
      metadata: {
        clientId: args.clientId,
        letterId: args.letterId,
        disputeItemCount: args.disputeItemIds.length,
      },
      createdAt: Date.now(),
    });

    return await ctx.db.get(logId);
  },
});


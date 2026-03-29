import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, createAuditLog } from "./lib/auth";
import { VALID_SOCIAL_PLATFORM_VALUES } from "./constants";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get current user by Clerk ID
 */
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});

/**
 * Get user by ID (authenticated, team+ only)
 */
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAuth(ctx, "team");
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get count of pending users (admin only, for nav badge)
 */
export const getPendingUserCount = query({
  handler: async (ctx) => {
    await requireAuth(ctx, "admin");
    const pending = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "pending"))
      .collect();
    return pending.length;
  },
});

/**
 * Get all pending users awaiting approval (admin only)
 */
export const getPendingUsers = query({
  handler: async (ctx) => {
    await requireAuth(ctx, "admin");

    const pendingUsers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "pending"))
      .order("desc")
      .collect();

    return pendingUsers;
  },
});

/**
 * Get all team members (admin only)
 */
export const getTeamMembers = query({
  handler: async (ctx) => {
    await requireAuth(ctx, "admin");

    const teamMembers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "team"))
      .order("desc")
      .collect();

    return teamMembers;
  },
});

/**
 * Get user by Clerk ID (for server-side checks like onboarding)
 * Requires authentication — caller can only look up their own Clerk ID
 */
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    if (identity.subject !== args.clerkId) {
      throw new Error("Access denied");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Complete onboarding - creates user record after Clerk signup
 */
export const completeOnboarding = mutation({
  args: {
    socialPlatform: v.string(),
    socialHandle: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    if (!VALID_SOCIAL_PLATFORM_VALUES.includes(args.socialPlatform as any)) {
      throw new Error("Invalid social platform");
    }
    if (!args.socialHandle.trim() || args.socialHandle.length > 100) {
      throw new Error("Invalid social handle");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser) {
      throw new Error("User already onboarded");
    }

    const userEmail = identity.email || "";
    const username = identity.nickname || identity.name || "Unknown";

    // Check for duplicate email
    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", userEmail))
      .unique();
    
    if (existingEmail) {
      throw new Error("A user with this email already exists");
    }

    // Check for duplicate username
    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    
    if (existingUsername) {
      throw new Error("A user with this username already exists");
    }

    // Determine role (lead admin auto-promotion)
    const leadAdminEmail = process.env.LEAD_ADMIN_EMAIL;
    const isLeadAdmin = leadAdminEmail && 
      userEmail.toLowerCase() === leadAdminEmail.toLowerCase();

    const role = isLeadAdmin ? "admin" : "pending";

    // Create user record
    const userId = await ctx.db.insert("users", {
      clerkId: identity.subject,
      username,
      email: userEmail,
      role,
      socialPlatform: args.socialPlatform,
      socialHandle: args.socialHandle,
      createdAt: Date.now(),
    });

    // Log the onboarding completion
    await ctx.db.insert("auditLogs", {
      action: "user_onboarding_complete",
      userId,
      userEmail,
      entityType: "user",
      entityId: userId,
      metadata: {
        socialPlatform: args.socialPlatform,
        socialHandle: args.socialHandle,
        autoPromotedToAdmin: !!isLeadAdmin,
      },
      createdAt: Date.now(),
    });

    return { success: true, role };
  },
});

/**
 * Promote a pending user to team member (admin only)
 */
export const promoteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "admin");

    const userToPromote = await ctx.db.get(args.userId);
    if (!userToPromote) throw new Error("User not found");
    if (userToPromote.role !== "pending") {
      throw new Error("User is not in pending status");
    }

    // Update user role in Convex
    await ctx.db.patch(args.userId, { role: "team" });

    // Log the action
    await createAuditLog(ctx, {
      action: "user_approved",
      user: currentUser,
      entityType: "user",
      entityId: args.userId,
      metadata: {
        promotedUserName: userToPromote.username,
        promotedUserEmail: userToPromote.email,
      },
    });

    return { success: true };
  },
});

/**
 * Deny a pending user (admin only)
 */
export const denyUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "admin");

    const userToDeny = await ctx.db.get(args.userId);
    if (!userToDeny) throw new Error("User not found");
    if (userToDeny.role !== "pending") {
      throw new Error("Can only deny pending users");
    }

    // Log the action BEFORE deletion
    await createAuditLog(ctx, {
      action: "user_denied",
      user: currentUser,
      entityType: "user",
      entityId: args.userId,
      metadata: {
        deniedUserName: userToDeny.username,
        deniedUserEmail: userToDeny.email,
      },
    });

    // Delete the user
    await ctx.db.delete(args.userId);

    return { success: true };
  },
});

/**
 * Demote a team member back to pending (admin only)
 */
export const demoteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx, "admin");

    const userToDemote = await ctx.db.get(args.userId);
    if (!userToDemote) throw new Error("User not found");
    if (userToDemote.role !== "team") {
      throw new Error("Can only demote team members");
    }

    // Update user role in Convex
    await ctx.db.patch(args.userId, { role: "pending" });

    // Log the action
    await createAuditLog(ctx, {
      action: "user_demoted",
      user: currentUser,
      entityType: "user",
      entityId: args.userId,
      metadata: {
        demotedUserName: userToDemote.username,
        demotedUserEmail: userToDemote.email,
      },
    });

    return { success: true };
  },
});


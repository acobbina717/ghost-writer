import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================================
  // USERS TABLE
  // ============================================================================
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("team"), v.literal("pending")),
    socialPlatform: v.string(), // 'telegram' | 'discord' | 'instagram'
    socialHandle: v.string(),
    createdAt: v.number(), // Unix timestamp
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  // ============================================================================
  // CLIENTS TABLE
  // ============================================================================
  clients: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    address1: v.string(),
    address2: v.optional(v.string()),
    city: v.string(),
    state: v.string(), // 2-letter state code
    zipCode: v.string(), // 5-digit ZIP
    last4SSN: v.string(), // Stored as "1234", displayed as "XXX-XX-1234"
    userId: v.id("users"),
    createdAt: v.number(), // Unix timestamp
  }).index("by_user", ["userId"]),

  // ============================================================================
  // DISPUTE ITEMS TABLE
  // ============================================================================
  disputeItems: defineTable({
    clientId: v.id("clients"),
    disputeType: v.string(), // e.g., "Medical", "Collection", "Late Payment"
    creditorName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    craTarget: v.string(), // 'experian' | 'equifax' | 'transunion'
    currentRound: v.number(),
    status: v.union(v.literal("pending"), v.literal("removed"), v.literal("verified")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"]),

  // ============================================================================
  // LETTERS TABLE
  // ============================================================================
  letters: defineTable({
    title: v.string(),
    content: v.string(), // Sanitized HTML from Tiptap
    applicableCRAs: v.array(v.string()), // ['experian', 'equifax', 'transunion']
    formSchema: v.optional(v.any()), // Ghost's custom field definitions
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ============================================================================
  // GENERATION LOGS TABLE
  // ============================================================================
  generationLogs: defineTable({
    clientId: v.id("clients"),
    userId: v.id("users"),
    letterId: v.id("letters"),
    disputeItemIds: v.array(v.id("disputeItems")),
    formAnswers: v.any(), // Key-value pairs of dynamic form inputs
    status: v.union(v.literal("pending"), v.literal("removed"), v.literal("verified")),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_user", ["userId"])
    .index("by_letter", ["letterId"]),

  // ============================================================================
  // AUDIT LOGS TABLE
  // ============================================================================
  // Retained for 1-2 years even after client PII is purged
  auditLogs: defineTable({
    action: v.string(), // 'client_created', 'client_purged', 'letter_generated', etc.
    userId: v.optional(v.id("users")), // Optional because user may be deleted
    userEmail: v.optional(v.string()), // Denormalized for when user is deleted
    entityType: v.string(), // 'client', 'dispute_item', 'letter', 'user'
    entityId: v.optional(v.string()), // String because it could reference any table
    metadata: v.optional(v.any()), // Action-specific context
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});


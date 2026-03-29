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
    .index("by_username", ["username"])
    .index("by_role", ["role"]),

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
    dateOfBirth: v.optional(v.string()), // Stored as "MM/DD/YYYY"
    userId: v.id("users"),
    createdAt: v.number(), // Unix timestamp
  }).index("by_user", ["userId"]),

  // ============================================================================
  // DISPUTE ITEMS TABLE
  // ============================================================================
  disputeItems: defineTable({
    clientId: v.id("clients"),
    disputeType: v.string(), // e.g., "Medical", "Collection", "Late Payment"
    craTarget: v.string(), // 'experian' | 'equifax' | 'transunion'
    currentRound: v.number(),
    status: v.union(v.literal("pending"), v.literal("removed"), v.literal("verified")),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Common to all schema groups
    creditorName: v.optional(v.string()),
    // Inquiry fields
    inquiryDate: v.optional(v.string()),
    // Account-Based fields
    accountNumber: v.optional(v.string()),
    dateOpened: v.optional(v.string()),
    balance: v.optional(v.string()),
    // Late Payment fields
    monthsLate: v.optional(v.string()), // "30" | "60" | "90" | "120"
    monthLate: v.optional(v.string()),  // "03/2022"
  })
    .index("by_client", ["clientId"])
    .index("by_status", ["status"]),

  // ============================================================================
  // LETTERS TABLE
  // ============================================================================
  letters: defineTable({
    title: v.string(),
    content: v.string(), // HTML with optional <!--dispute_block_start/end--> markers
    disputeTypes: v.array(v.string()), // Must all belong to the same schema group
    applicableCRAs: v.array(v.string()), // ['experian', 'equifax', 'transunion']
    maxDisputeItems: v.optional(v.number()), // Max items per CRA per letter
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
    status: v.union(v.literal("pending"), v.literal("removed"), v.literal("verified")),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_user", ["userId"])
    .index("by_letter", ["letterId"])
    .index("by_created_at", ["createdAt"]),

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
    metadata: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
    .index("by_entity", ["entityType", "entityId"]),
});

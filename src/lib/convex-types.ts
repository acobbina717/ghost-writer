/**
 * Convex Type Definitions
 *
 * Base document types are derived from the Convex-generated data model.
 * Extended types (with computed fields) are defined here.
 */

import type { Doc, Id } from "../../convex/_generated/dataModel";

// Re-export generated document types
export type ConvexUser = Doc<"users">;
export type ConvexClient = Doc<"clients">;
export type ConvexDisputeItem = Doc<"disputeItems">;
export type ConvexLetter = Doc<"letters">;

// Re-export Id type for convenience
export type { Id };

// Derived union types from schema
export type UserRole = ConvexUser["role"];
export type DisputeStatus = ConvexDisputeItem["status"];

// Alert level for client PII purge warnings
export type AlertLevel = "none" | "warning" | "danger";

// Client with computed dispute counts (returned by getClientsWithDisputes)
export interface ClientWithDisputes extends ConvexClient {
  daysActive: number;
  totalDisputes: number;
  pendingDisputes: number;
  alertLevel: AlertLevel;
  lastDisputeUpdatedAt: number | null;
}

// Per-CRA success rate breakdown
export interface CraSuccessStats {
  removed: number;
  resolved: number;
  rate: number | null;
}

// Letter analytics (returned by getLetterAnalytics)
export interface LetterAnalytics {
  id: Id<"letters">;
  title: string;
  totalDownloads: number;
  uniqueUsers: number;
  successRate: number | null;
  perCraStats: Record<string, CraSuccessStats>;
  lastUsed: number | null;
}

// Stats types (returned by query handlers)
export interface ClientStats {
  totalClients: number;
  pendingItems: number;
  approachingPurge: number;
  portfolioSuccessRate: number | null;
}

export interface LetterStats {
  totalLetters: number;
  totalDownloadsThisMonth: number;
  avgSuccessRate: number | null;
}

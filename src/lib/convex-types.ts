/**
 * Convex Type Definitions
 * 
 * These types mirror the Convex schema and are used across the app.
 * They'll be replaced by generated types from `convex/_generated/dataModel`
 * once you run `npx convex dev`.
 */

// User types
export type UserRole = 'admin' | 'team' | 'pending';

export interface ConvexUser {
  _id: string;
  _creationTime: number;
  clerkId: string;
  username: string;
  email: string;
  role: UserRole;
  socialPlatform: string;
  socialHandle: string;
  createdAt: number;
}

// Client types
export type AlertLevel = 'none' | 'warning' | 'danger';

export interface ConvexClient {
  _id: string;
  _creationTime: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  last4SSN: string;
  userId: string;
  createdAt: number;
}

export interface ClientWithDisputes extends ConvexClient {
  daysActive: number;
  totalDisputes: number;
  pendingDisputes: number;
  alertLevel: AlertLevel;
}

// Dispute types
export type DisputeStatus = 'pending' | 'removed' | 'verified';

export interface ConvexDisputeItem {
  _id: string;
  _creationTime: number;
  clientId: string;
  disputeType: string;
  creditorName?: string;
  accountNumber?: string;
  craTarget: string;
  currentRound: number;
  status: DisputeStatus;
  createdAt: number;
  updatedAt: number;
}

// Letter types
export interface ConvexLetter {
  _id: string;
  _creationTime: number;
  title: string;
  content: string;
  applicableCRAs: string[];
  formSchema?: unknown;
  createdAt: number;
  updatedAt: number;
}

export interface LetterAnalytics {
  id: string;
  title: string;
  totalDownloads: number;
  uniqueUsers: number;
  successRate: number | null;
  lastUsed: number | null;
}

// Form schema field type
export interface FormSchemaField {
  type: 'text' | 'date' | 'textarea' | 'select' | 'checkbox';
  label: string;
  tagId: string;
  placeholder?: string;
  options?: string[];
}

// Stats types
export interface ClientStats {
  totalClients: number;
  pendingItems: number;
  approachingPurge: number;
}

export interface LetterStats {
  totalLetters: number;
  totalDownloadsThisMonth: number;
  avgSuccessRate: number | null;
}


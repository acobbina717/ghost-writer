/**
 * Application-wide constants
 * Centralized for easy configuration and reference
 */

// =============================================================================
// PII PURGE FEATURE FLAG
// =============================================================================

/**
 * Feature flag: Enable/disable PII purge warnings and automation.
 * 
 * When false (current):
 * - No warning/danger badges shown in UI
 * - "Approaching Purge" stat hidden from dashboard
 * - Days active tracking continues (informational only)
 * 
 * When true (future):
 * - Warning badges appear at 80+ days
 * - Danger badges appear at 85+ days
 * - "Approaching Purge" stat shown on dashboard
 * - Requires convex/crons.ts implementation for automation
 * 
 * @see DEVELOPMENT_PHASING.md Phase 2 for implementation timeline
 */
export const PURGE_ENABLED = false;

/**
 * Days after which a warning is shown for clients approaching PII purge.
 * Only applies when PURGE_ENABLED is true.
 */
export const PURGE_WARNING_DAYS = 80;

/**
 * Days after which a danger/urgent indicator is shown.
 * Only applies when PURGE_ENABLED is true.
 */
export const PURGE_DANGER_DAYS = 85;

/**
 * Maximum days before client PII would be automatically purged.
 * 
 * NOTE: No automation currently exists. This is informational only.
 * Implementation required: convex/crons.ts with scheduled purge function.
 */
export const PURGE_LIMIT_DAYS = 91;

// =============================================================================
// CREDIT REPORTING AGENCIES
// =============================================================================

/**
 * CRA display labels and colors for badges.
 */
export const CRA_LABELS: Record<string, { label: string; color: string }> = {
  experian: { label: 'Experian', color: 'blue' },
  equifax: { label: 'Equifax', color: 'red' },
  transunion: { label: 'TransUnion', color: 'green' },
};

/**
 * Get CRA info with fallback for unknown values.
 */
export function getCraInfo(craTarget: string) {
  return CRA_LABELS[craTarget] ?? { label: craTarget, color: 'gray' };
}

// =============================================================================
// DISPUTE STATUS
// =============================================================================

/**
 * Dispute status badge colors.
 */
export const DISPUTE_STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  removed: 'green',
  verified: 'red',
};

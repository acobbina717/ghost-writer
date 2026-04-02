/**
 * Application-wide constants
 * Centralized for easy configuration and reference
 */

// Re-export shared purge constants from single source of truth
export { PURGE_WARNING_DAYS, PURGE_DANGER_DAYS } from '../../convex/constants';

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
  equifax: { label: 'Equifax', color: 'indigo' },
  transunion: { label: 'TransUnion', color: 'green' },
  lexisnexis: { label: 'LexisNexis', color: 'violet' },
  chexsystems: { label: 'ChexSystems', color: 'orange' },
  earlywarning: { label: 'EarlyWarning', color: 'teal' },
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
  no_change: 'gray',
};

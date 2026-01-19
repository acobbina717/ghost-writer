/**
 * Ghost-Writer Design System - Color Tokens (v1.5)
 * Single Source of Truth for all color values
 *
 * Used by:
 * - ghost-theme.ts (Mantine)
 * - layout.tsx (Clerk appearance)
 * - Any component needing direct color access
 */

// =============================================================================
// OTF RED - The Precision Accent
// =============================================================================

export const red = {
  0: '#FFF1F1',
  1: '#FFDFDF',
  2: '#FFC4C4',
  3: '#FF9B9B',
  4: '#FF6666',
  5: '#FF3939',
  6: '#E21C1C', // Primary
  7: '#C11414', // Hover
  8: '#A01111', // Active
  9: '#831212', // Darkest
} as const;

export const redPrimary = red[6];
export const redHover = red[7];

// =============================================================================
// DARK MODE PALETTE - Simplified & Lifted
// =============================================================================

export const dark = {
  base: '#111216',
  surface: '#16181C',
  elevated: '#1E2026',
  inset: '#1B1D23',

  textPrimary: '#F4F5F7',
  textSecondary: '#B9BDC7',
  textTertiary: '#8D93A0',
  textMuted: '#8D93A0',

  borderDefault: '#2A2D34',
  borderSubtle: '#1D1F25',
  borderStrong: '#363B45',

  shadowLg: '0 16px 48px rgba(0, 0, 0, 0.35)',
} as const;

// =============================================================================
// LIGHT MODE PALETTE - Simplified
// =============================================================================

export const light = {
  base: '#F7F7F8',
  surface: '#FFFFFF',
  elevated: '#F0F1F3',
  inset: '#E9EBEF',

  textPrimary: '#0D0E11',
  textSecondary: '#4B4F58',
  textTertiary: '#6A7080',
  textMuted: '#6A7080',

  borderDefault: '#E5E7EA',
  borderSubtle: '#EFF1F3',
  borderStrong: '#D4D7DD',

  shadowLg: '0 16px 48px rgba(0, 0, 0, 0.12)',
} as const;

// =============================================================================
// SEMANTIC COLORS
// =============================================================================

export const semantic = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#0EA5E9',
} as const;

// =============================================================================
// MANTINE COLOR TUPLES
// =============================================================================

export const mantineRed = [
  red[0],
  red[1],
  red[2],
  red[3],
  red[4],
  red[5],
  red[6],
  red[7],
  red[8],
  red[9],
] as const;

export const mantineDark = [
  '#C5C5C5',
  '#B9BDC7',
  '#8D93A0',
  '#6A7080',
  '#363B45',
  '#2A2D34',
  '#1E2026',
  '#16181C',
  '#13151A',
  '#111216',
] as const;

export const neutral = [
  '#FFFFFF',
  '#F7F7F8',
  '#F0F1F3',
  '#E9EBEF',
  '#E5E7EA',
  '#D4D7DD',
  '#6A7080',
  '#4B4F58',
  '#2A2D34',
  '#111216',
] as const;

// =============================================================================
// TYPOGRAPHY & RADIUS
// =============================================================================

export const fonts = {
  sans: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const radius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

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

// =============================================================================
// SLATE BLUE - Primary Action Color
// Trustworthy, professional, distinct from all semantic colors.
// Red is the brand signature; Slate Blue is the functional action color.
// =============================================================================

export const action = {
  0: '#EEF2FF',
  1: '#E0E7FF',
  2: '#C7D2FE',
  3: '#A5B4FC',
  4: '#818CF8',
  5: '#6366F1',
  6: '#4B6BFB', // Primary
  7: '#4338CA', // Hover
  8: '#3730A3', // Active
  9: '#312E81', // Darkest
} as const;

export const actionPrimary = action[6];
export const actionHover = action[7];

// =============================================================================
// DARK MODE PALETTE - Simplified & Lifted
// Dark mode is active — defaultColorScheme is set to "auto" in layout.tsx.
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
// LIGHT MODE PALETTE - Simplified (Soft Neutral)
// =============================================================================

export const light = {
  base: '#F1F3F5',    // Soft Neutral Gray
  surface: '#F8F9FA', // Off-White — subtle elevation per Experience Blueprint
  elevated: '#F1F3F5',
  inset: '#E9ECEF',

  textPrimary: '#212529',   // Soft Charcoal
  textSecondary: '#495057', // Muted Gray
  textTertiary: '#868E96',
  textMuted: '#ADB5BD',

  borderDefault: '#DEE2E6',
  borderSubtle: '#E9ECEF',
  borderStrong: '#CED4DA',

  shadowLg: '0 16px 48px rgba(0, 0, 0, 0.08)',
} as const;

// =============================================================================
// SEMANTIC COLORS
// =============================================================================

export const semantic = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#E5484D',
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

export const mantineAction = [
  action[0],
  action[1],
  action[2],
  action[3],
  action[4],
  action[5],
  action[6],
  action[7],
  action[8],
  action[9],
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
  '#FFFFFF', // 0: Pure White (Surfaces)
  '#F8F9FA', // 1: Very Light Gray
  '#F1F3F5', // 2: App Base (Soft Neutral)
  '#E9ECEF', // 3: Elevated Surface
  '#DEE2E6', // 4: Borders Default
  '#CED4DA', // 5: Borders Strong
  '#868E96', // 6: Muted Text
  '#495057', // 7: Secondary Text
  '#343A40', // 8: Dark Text
  '#212529', // 9: Primary Text (Soft Charcoal)
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

import { createTheme, MantineColorsTuple, rem } from '@mantine/core';
import { mantineRed, mantineAction, mantineDark, neutral, fonts } from './colors';

const otfRed = mantineRed as unknown as MantineColorsTuple;
const actionScale = mantineAction as unknown as MantineColorsTuple;
const darkScale = mantineDark as unknown as MantineColorsTuple;
const neutralScale = neutral as unknown as MantineColorsTuple;

/** Layout height constants — single source of truth for all pixel-locked heights */
export const LAYOUT = {
  HEADER_LAYER1: 60,
  HEADER_LAYER2: 48,
  HEADER_TOTAL: 108,
  MOBILE_NAV_HEIGHT: 56,
  GUTTER_WIDE: 200,
  GUTTER_MEDIUM: 48,
  EDITOR_HEIGHT: 500,
  PAPER_MAX_WIDTH: 816,
} as const;

/** Z-index scale — keep components stacking predictably */
export const Z = {
  CONFIG_HEADER: 10,
  MOBILE_NAV: 100,
} as const;

/** Font weight roles — map semantic roles to numeric weights */
export const FW = {
  HERO: 900,
  HEADING: 700,
  LABEL: 600,
  BODY: 500,
} as const;

export const ghostTheme = createTheme({
  // Typography
  fontFamily: fonts.sans,
  fontFamilyMonospace: fonts.mono,
  
  headings: {
    fontFamily: fonts.sans,
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.1', fontWeight: '900' },
      h2: { fontSize: rem(24), lineHeight: '1.2', fontWeight: '700' },
      h3: { fontSize: rem(20), lineHeight: '1.3', fontWeight: '600' },
      h4: { fontSize: rem(16), lineHeight: '1.4', fontWeight: '500' },
    },
  },

  // Font sizes
  fontSizes: {
    xxs: rem(10),
    xs: rem(11),
    sm: rem(13), // Slightly larger base for legibility
    md: rem(15),
    lg: rem(18),
    xl: rem(24),
  },

  // Spacing (Logical scale)
  spacing: {
    xxs: rem(2),
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(40),
  },

  // Sharp radius by default
  radius: {
    xs: rem(2),
    sm: rem(4),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
  },
  defaultRadius: 'sm',

  // Layout Constants
  other: {
    headerHeight: 60,
    contextRibbonHeight: 48,
    mobileNavHeight: 56,
    gutterWidth: 200,
    collapsedGutterWidth: 48,
    paperMaxWidth: 816,
  },

  // Colors - now imported from single source of truth

  primaryColor: 'action',
  primaryShade: { light: 6, dark: 5 },
  
  colors: {
    red: otfRed,
    action: actionScale,
    dark: darkScale,
    gray: neutralScale,
  },

  // Shadows
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 12px rgba(0, 0, 0, 0.12)',
    lg: '0 12px 32px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 48px rgba(0, 0, 0, 0.2)',
  },

  // Component overrides
  components: {
    Button: {
      defaultProps: {
        radius: 'sm',
        size: 'md',
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: 'transform 100ms ease, box-shadow 100ms ease',
        },
      },
    },
    
    TextInput: {
      defaultProps: {
        size: 'sm',
      },
      styles: {
        label: {
          fontSize: rem(12),
          fontWeight: 600,
          marginBottom: rem(4),
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--ls-wide)',
        },
        input: {
          borderRadius: rem(4),
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          '&:focus': {
            borderColor: 'var(--mantine-primary-color-filled)',
          },
        },
      },
    },

    Select: {
      defaultProps: {
        size: 'sm',
      },
      styles: {
        label: {
          fontSize: rem(12),
          fontWeight: 600,
          marginBottom: rem(4),
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--ls-wide)',
        },
      },
    },

    Card: {
      defaultProps: {
        radius: 'sm',
        withBorder: true,
        padding: 'md',
      },
      styles: {
        root: {
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        },
      },
    },

    Paper: {
      defaultProps: {
        radius: 'sm',
      },
      styles: {
        root: {
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        },
      },
    },

    Table: {
      styles: {
        table: {
          backgroundColor: 'var(--bg-surface)',
        },
        th: {
          fontSize: rem(11),
          fontWeight: 600,
          letterSpacing: 'var(--ls-wider)',
          textTransform: 'uppercase' as const,
          color: 'var(--text-tertiary)',
          borderBottom: '1px solid var(--border-default)',
          paddingTop: rem(12),
          paddingBottom: rem(12),
        },
        td: {
          paddingTop: rem(12),
          paddingBottom: rem(12),
          borderBottom: '1px solid var(--border-subtle)',
        },
      },
    },

    AppShell: {
      styles: {
        main: {
          backgroundColor: 'var(--bg-base)',
        },
        navbar: {
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        },
        header: {
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        },
      },
    },
  },
});

import { createTheme, MantineColorsTuple, rem } from '@mantine/core';
import { mantineRed, mantineDark, neutral, fonts } from './colors';

const otfRed = mantineRed as unknown as MantineColorsTuple;
const darkScale = mantineDark as unknown as MantineColorsTuple;
const neutralScale = neutral as unknown as MantineColorsTuple;

export const ghostTheme = createTheme({
  // Typography
  fontFamily: fonts.sans,
  fontFamilyMonospace: fonts.mono,
  
  headings: {
    fontFamily: fonts.sans,
    fontWeight: '900',
    sizes: {
      h1: { fontSize: rem(32), lineHeight: '1.2' },
      h2: { fontSize: rem(24), lineHeight: '1.25' },
      h3: { fontSize: rem(20), lineHeight: '1.3' },
      h4: { fontSize: rem(16), lineHeight: '1.4' },
    },
  },

  // Font sizes
  fontSizes: {
    xs: rem(11),
    sm: rem(12),
    md: rem(14),
    lg: rem(16),
    xl: rem(20),
  },

  // Spacing (8px base)
  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },

  // Sharp radius by default
  radius: {
    xs: rem(2),
    sm: rem(4),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
  },
  defaultRadius: 'xs',

  // Colors - now imported from single source of truth
  primaryColor: 'red',
  primaryShade: { light: 6, dark: 6 },
  
  colors: {
    red: otfRed,
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
        radius: 'xs',
      },
      styles: {
        root: {
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase' as const,
        },
      },
    },
    
    TextInput: {
      styles: {
        label: {
          fontSize: rem(11),
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          marginBottom: rem(4),
        },
        input: {
          borderRadius: rem(2),
        },
      },
    },

    Textarea: {
      styles: {
        label: {
          fontSize: rem(11),
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          marginBottom: rem(4),
        },
        input: {
          borderRadius: rem(2),
        },
      },
    },

    Select: {
      styles: {
        label: {
          fontSize: rem(11),
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          marginBottom: rem(4),
        },
      },
    },

    Card: {
      defaultProps: {
        radius: 'sm',
        withBorder: true,
      },
    },

    Modal: {
      defaultProps: {
        radius: 'md',
        centered: true,
      },
      styles: {
        header: {
          fontWeight: 700,
        },
      },
    },

    Table: {
      styles: {
        th: {
          fontSize: rem(11),
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
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

import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ClerkProvider } from '@clerk/nextjs';
import { ghostTheme } from '@/theme/ghost-theme';
import {
  actionPrimary,
  actionHover,
  semantic,
  fonts,
  radius,
} from '@/theme/colors';
import { ConvexClientProvider } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ghost-Writer | Credit Repair Automation',
  description: 'Internal automation hub for credit dispute letter generation',
};

const clerkAppearance = {
  variables: {
    colorPrimary: actionPrimary,
    colorDanger: semantic.error,
    borderRadius: radius.md,
    fontFamily: fonts.sans,
  },
  elements: {
    rootBox: {
      width: '100%',
    },

    cardBox: {
      boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
    },

    card: {
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: radius.md,
      boxShadow: 'none',
    },

    formFieldInput: {
      backgroundColor: 'var(--bg-inset)',
      border: '1px solid var(--border-default)',
      borderRadius: radius.sm,
      color: 'var(--text-primary)',
      transition: 'border-color 150ms ease, box-shadow 150ms ease',
    },
    'formFieldInput:focus': {
      borderColor: actionPrimary,
      boxShadow: `0 0 0 2px ${actionPrimary}33`,
      outline: 'none',
    },

    formFieldLabel: {
      color: 'var(--text-secondary)',
      fontSize: '12px',
      fontWeight: '500',
    },

    formButtonPrimary: {
      backgroundColor: actionPrimary,
      color: '#FFFFFF',
      fontWeight: '600',
      borderRadius: radius.sm,
      boxShadow: `0 2px 4px ${actionPrimary}40`,
    },
    'formButtonPrimary:hover': {
      backgroundColor: actionHover,
      boxShadow: `0 4px 8px ${actionHover}50`,
    },

    footerActionLink: {
      color: actionPrimary,
    },
    'footerActionLink:hover': {
      color: actionHover,
    },

    headerTitle: {
      color: 'var(--text-primary)',
      fontWeight: '900',
    },
    headerSubtitle: {
      color: 'var(--text-tertiary)',
      fontSize: '12px',
    },

    identityPreviewText: {
      color: 'var(--text-primary)',
    },
    identityPreviewEditButton: {
      color: actionPrimary,
    },

    formFieldInputShowPasswordButton: {
      color: 'var(--text-tertiary)',
    },
    'formFieldInputShowPasswordButton:hover': {
      color: 'var(--text-secondary)',
    },

    otpCodeFieldInput: {
      backgroundColor: 'var(--bg-inset)',
      border: '1px solid var(--border-default)',
      borderRadius: radius.sm,
      color: 'var(--text-primary)',
    },

    footer: {
      backgroundColor: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-default)',
      color: 'var(--text-tertiary)',
    },
    footerAction: {
      backgroundColor: 'transparent',
      color: 'var(--text-tertiary)',
    },
    footerActionText: {
      color: 'var(--text-tertiary)',
    },
    footerPages: {
      backgroundColor: 'var(--bg-surface)',
      color: 'var(--text-muted)',
    },
    footerPagesLink: {
      color: 'var(--text-muted)',
    },
    'footerPagesLink:hover': {
      color: actionPrimary,
    },

    formFieldInputGroup: {
      borderColor: 'var(--border-default)',
    },

    socialButtonsBlockButton: {
      display: 'none',
    },
    socialButtonsBlockButtonText: {
      display: 'none',
    },
    dividerLine: {
      display: 'none',
    },
    dividerText: {
      display: 'none',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if Clerk is configured
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Only render with providers if Clerk key is available
  if (!clerkPubKey) {
    return (
      <html lang="en" {...mantineHtmlProps}>
        <head>
          <ColorSchemeScript defaultColorScheme="light" />
          <link
            href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <MantineProvider theme={ghostTheme} defaultColorScheme="light">
            <Notifications position="bottom-right" />
            {children}
          </MantineProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        {/* Satoshi font from Fontshare */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClerkProvider appearance={clerkAppearance}>
          <ConvexClientProvider>
            <MantineProvider theme={ghostTheme} defaultColorScheme="light">
              <Notifications position="bottom-right" />
              {children}
            </MantineProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

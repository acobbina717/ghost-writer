import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ClerkProvider } from '@clerk/nextjs';
import { ghostTheme } from '@/theme/ghost-theme';
import { 
  redPrimary, 
  redHover,
  dark as darkColors,
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
    colorPrimary: redPrimary,
    colorBackground: darkColors.surface,
    colorInputBackground: darkColors.inset,
    colorInputText: darkColors.textPrimary,
    colorText: darkColors.textPrimary,
    colorTextSecondary: darkColors.textSecondary,
    colorDanger: semantic.error,
    borderRadius: radius.md,
    fontFamily: fonts.sans,
  },
  elements: {
    rootBox: {
      width: '100%',
    },
    
    card: {
      backgroundColor: darkColors.surface,
      border: `1px solid ${darkColors.borderDefault}`,
      borderRadius: radius.md,
      boxShadow: darkColors.shadowLg,
    },
    
    formFieldInput: {
      backgroundColor: darkColors.inset,
      border: `1px solid ${darkColors.borderDefault}`,
      borderRadius: radius.xs,
      color: darkColors.textPrimary,
      transition: 'border-color 150ms ease, box-shadow 150ms ease',
    },
    'formFieldInput:focus': {
      borderColor: redPrimary,
      boxShadow: `0 0 0 2px ${redPrimary}33`,
      outline: 'none',
    },
    
    formFieldLabel: {
      color: darkColors.textSecondary,
      fontSize: '11px',
      fontWeight: '500',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
    
    formButtonPrimary: {
      backgroundColor: redPrimary,
      color: '#FFFFFF',
      fontWeight: '700',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
      borderRadius: radius.xs,
      boxShadow: '0 2px 4px rgba(226, 28, 28, 0.25)',
    },
    'formButtonPrimary:hover': {
      backgroundColor: redHover,
      boxShadow: '0 4px 8px rgba(226, 28, 28, 0.35)',
    },
    
    footerActionLink: {
      color: redPrimary,
    },
    'footerActionLink:hover': {
      color: redHover,
    },
    
    headerTitle: {
      color: darkColors.textPrimary,
      fontWeight: '900',
    },
    headerSubtitle: {
      color: darkColors.textTertiary,
      fontSize: '12px',
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    },
    
    identityPreviewText: {
      color: darkColors.textPrimary,
    },
    identityPreviewEditButton: {
      color: redPrimary,
    },
    
    formFieldInputShowPasswordButton: {
      color: darkColors.textTertiary,
    },
    'formFieldInputShowPasswordButton:hover': {
      color: darkColors.textSecondary,
    },
    
    otpCodeFieldInput: {
      backgroundColor: darkColors.inset,
      border: `1px solid ${darkColors.borderDefault}`,
      borderRadius: radius.xs,
      color: darkColors.textPrimary,
    },
    
    footer: {
      backgroundColor: darkColors.surface,
      color: darkColors.textTertiary,
    },
    footerAction: {
      backgroundColor: 'transparent',
      color: darkColors.textTertiary,
    },
    footerActionText: {
      color: darkColors.textTertiary,
    },
    footerPages: {
      backgroundColor: 'transparent',
      color: darkColors.textMuted,
    },
    footerPagesLink: {
      color: darkColors.textMuted,
    },
    'footerPagesLink:hover': {
      color: redPrimary,
    },
    
    // Internal elements
    formFieldInputGroup: {
      borderColor: darkColors.borderDefault,
    },
    
    // Hide social login buttons (not using OAuth providers)
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
          <ColorSchemeScript defaultColorScheme="auto" />
          <link
            href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <MantineProvider theme={ghostTheme} defaultColorScheme="auto">
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
        <ColorSchemeScript defaultColorScheme="auto" />
        {/* Satoshi font from Fontshare */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClerkProvider appearance={clerkAppearance}>
          <ConvexClientProvider>
            <MantineProvider theme={ghostTheme} defaultColorScheme="auto">
              <Notifications position="bottom-right" />
              {children}
            </MantineProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

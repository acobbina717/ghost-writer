'use client';

import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import cx from 'clsx';
import classes from './ColorSchemeToggle.module.css';
import { Z } from '@/theme/ghost-theme';

export interface ColorSchemeToggleProps {
  /** 
   * Position mode:
   * - 'absolute': Fixed position top-right (for public pages)
   * - 'static': Normal flow position (for inline use)
   */
  position?: 'absolute' | 'static';
}

/**
 * ColorSchemeToggle component for switching between light and dark mode.
 * Per DESIGN_SYSTEM.md section 11.5:
 * - Public Pages: Absolute positioned top-right (20px inset)
 * - Authenticated Pages: In AppShell header (use 'static')
 * 
 * Uses Mantine's recommended pattern for hydration-safe color scheme toggle:
 * - useComputedColorScheme with getInitialValueInEffect: true
 * - CSS-based icon switching to avoid hydration mismatch
 */
export function ColorSchemeToggle({ position = 'absolute' }: ColorSchemeToggleProps) {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const positionStyles = position === 'absolute' 
    ? {
        position: 'absolute' as const,
        top: 20,
        right: 20,
        zIndex: Z.MOBILE_NAV,
      }
    : {};

  return (
    <ActionIcon
      variant="subtle"
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      size="lg"
      aria-label="Toggle color scheme"
      style={positionStyles}
    >
      <IconSun className={cx(classes.icon, classes.light)} size={18} stroke={1.5} />
      <IconMoon className={cx(classes.icon, classes.dark)} size={18} stroke={1.5} />
    </ActionIcon>
  );
}

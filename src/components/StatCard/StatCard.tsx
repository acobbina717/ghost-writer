'use client';

import { Card, Group, RingProgress, Text, ThemeIcon } from '@mantine/core';
import type { KeyboardEvent } from 'react';
import { FW } from '@/theme/ghost-theme';

export interface StatCardProps {
  /** Label displayed above the value */
  label: string;
  /** Main value to display */
  value: React.ReactNode;
  /** Subtitle displayed below the value */
  subtitle: string;
  /** Icon component (use Tabler icons) */
  icon: React.ReactNode;
  /** ThemeIcon color (defaults to primary) */
  color?: string;
  /** Optional ring progress indicator (0-100 percentage) */
  ring?: {
    value: number;
    color?: string;
  };
  /** Optional click handler for interactive cards */
  onClick?: () => void;
  /** Whether the card is in an active/selected state */
  active?: boolean;
}

/**
 * StatCard - Reusable stat display card for dashboards.
 * Provides consistent styling for metric display across the application.
 */
export function StatCard({
  label,
  value,
  subtitle,
  icon,
  color,
  ring,
  onClick,
  active,
}: StatCardProps) {
  const isInteractive = !!onClick;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      withBorder
      padding="md"
      className={isInteractive ? 'card-interactive' : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-pressed={isInteractive ? active : undefined}
      style={{
        cursor: isInteractive ? 'pointer' : undefined,
        outline: active ? '2px solid var(--mantine-primary-color-filled)' : undefined,
      }}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
    >
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed" fw={FW.BODY}>
          {label}
        </Text>
        <ThemeIcon variant="light" size="lg" radius="sm" color={color}>
          {icon}
        </ThemeIcon>
      </Group>
      <Group justify="space-between" align="flex-end" wrap="nowrap">
        <div>
          <Text size="xl" fw={FW.HEADING}>
            {value}
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            {subtitle}
          </Text>
        </div>
        {ring && (
          <RingProgress
            size={60}
            thickness={5}
            roundCaps
            sections={[{ value: ring.value, color: ring.color ?? color ?? 'blue' }]}
            label={
              <Text size="xs" ta="center" fw={FW.HEADING}>
                {ring.value}%
              </Text>
            }
          />
        )}
      </Group>
    </Card>
  );
}

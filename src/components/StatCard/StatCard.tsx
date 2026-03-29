'use client';

import { Card, Group, Text, ThemeIcon } from '@mantine/core';
import type { KeyboardEvent } from 'react';

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
      padding="lg"
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
        <Text size="sm" c="dimmed" fw={500}>
          {label}
        </Text>
        <ThemeIcon variant="light" size="lg" radius="sm" color={color}>
          {icon}
        </ThemeIcon>
      </Group>
      <Text size="xl" fw={700}>
        {value}
      </Text>
      <Text size="xs" c="dimmed" mt="xs">
        {subtitle}
      </Text>
    </Card>
  );
}

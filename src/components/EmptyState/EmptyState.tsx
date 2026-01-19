'use client';

import Link from 'next/link';
import { Card, Stack, Title, Text, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

export interface EmptyStateProps {
  /** Icon to display (use Tabler icons) */
  icon: React.ReactNode;
  /** Main title text */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    /** Link href - use this for navigation */
    href?: string;
    /** Click handler - use this for modals/actions */
    onClick?: () => void;
    icon?: React.ReactNode;
  };
}

/**
 * EmptyState component for displaying when a table or list has no data.
 * Provides consistent empty state UI across the application.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card withBorder padding="xl">
      <Stack align="center" gap="md" py="xl">
        <div style={{ color: 'var(--text-muted)' }}>
          {icon}
        </div>
        <div style={{ textAlign: 'center' }}>
          <Title order={3} mb="xs">
            {title}
          </Title>
          <Text c="dimmed" maw={400}>
            {description}
          </Text>
        </div>
        {action && (
          action.href ? (
            <Button
              component={Link}
              href={action.href}
              leftSection={action.icon || <IconPlus size={16} />}
              mt="md"
            >
              {action.label}
            </Button>
          ) : (
            <Button
              onClick={action.onClick}
              leftSection={action.icon || <IconPlus size={16} />}
              mt="md"
            >
              {action.label}
            </Button>
          )
        )}
      </Stack>
    </Card>
  );
}

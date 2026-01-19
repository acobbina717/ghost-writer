'use client';

import {
  Title,
  Text,
  SimpleGrid,
  Stack,
  Group,
} from '@mantine/core';
import {
  IconFileText,
  IconDownload,
  IconChartBar,
  IconUsers,
  IconPlus,
} from '@tabler/icons-react';
import type { LetterAnalytics } from '@/lib/convex-types';
import { LetterAnalyticsTable } from './LetterAnalyticsTable';
import { EmptyState } from '@/components/EmptyState';
import { LinkButton } from '@/components/LinkButton';
import { StatCard } from '@/components/StatCard';

// =============================================================================
// TYPES
// =============================================================================

interface AdminDashboardProps {
  username: string;
  letters: LetterAnalytics[];
  stats: {
    totalLetters: number;
    totalDownloadsThisMonth: number;
    avgSuccessRate: number | null;
    teamMemberCount: number;
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AdminDashboard({ username, letters, stats }: AdminDashboardProps) {
  return (
    <Stack gap="xl">
      {/* Header */}
      <div>
        <Title order={1} mb="xs">
          Welcome back, {username}
        </Title>
        <Text c="dimmed">
          Manage your letter library and monitor team performance.
        </Text>
      </div>

      {/* Stat Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        <StatCard
          label="Total Letters"
          value={stats.totalLetters}
          subtitle="In library"
          icon={<IconFileText size={20} />}
        />

        <StatCard
          label="Downloads This Month"
          value={stats.totalDownloadsThisMonth}
          subtitle="Letters generated"
          icon={<IconDownload size={20} />}
          color="blue"
        />

        <StatCard
          label="Avg Success Rate"
          value={stats.avgSuccessRate !== null ? `${stats.avgSuccessRate}%` : '—'}
          subtitle="Items removed"
          icon={<IconChartBar size={20} />}
          color={
            stats.avgSuccessRate === null
              ? 'gray'
              : stats.avgSuccessRate >= 70
              ? 'green'
              : stats.avgSuccessRate >= 40
              ? 'yellow'
              : 'red'
          }
        />

        <StatCard
          label="Team Members"
          value={stats.teamMemberCount}
          subtitle="Active users"
          icon={<IconUsers size={20} />}
          color="grape"
        />
      </SimpleGrid>

      {/* Letter Analytics Table or Empty State */}
      {letters.length === 0 ? (
        <EmptyState
          icon={<IconFileText size={48} />}
          title="No Letters Yet"
          description="Create your first dispute letter template to start tracking analytics."
          action={{
            label: 'Create Letter',
            href: '/admin/letters/new',
            icon: <IconPlus size={16} />,
          }}
        />
      ) : (
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={3}>Letter Performance</Title>
            <LinkButton
              href="/admin/letters"
              variant="subtle"
              size="xs"
            >
              View All Letters
            </LinkButton>
          </Group>
          <LetterAnalyticsTable letters={letters} />
        </Stack>
      )}
    </Stack>
  );
}


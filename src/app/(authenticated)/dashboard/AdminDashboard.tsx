'use client';

import {
  Title,
  Text,
  SimpleGrid,
  Stack,
  Group,
  Table,
  Badge,
  Paper,
  ScrollArea,
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

interface DisputeTypePerf {
  disputeType: string;
  total: number;
  removed: number;
  resolved: number;
  rate: number | null;
}

interface RoundPerf {
  round: number;
  total: number;
  removed: number;
  resolved: number;
  rate: number | null;
}

interface AdminDashboardProps {
  username: string;
  letters: LetterAnalytics[];
  stats: {
    totalLetters: number;
    totalDownloadsThisMonth: number;
    avgSuccessRate: number | null;
    teamMemberCount: number;
  };
  disputeTypePerformance: DisputeTypePerf[];
  roundPerformance: RoundPerf[];
}

// =============================================================================
// COMPONENT
// =============================================================================

function getRateColor(rate: number | null): string {
  if (rate === null) return 'gray';
  if (rate >= 70) return 'green';
  if (rate >= 40) return 'yellow';
  return 'red';
}

export function AdminDashboard({ username, letters, stats, disputeTypePerformance, roundPerformance }: AdminDashboardProps) {
  return (
    <Stack gap="xl">
      {/* Header */}
      <div>
        <Title order={1} mb="xs">
          Welcome back, {username}
        </Title>
        <Text c="dimmed">
          Ghost is ready. Manage templates and monitor the team.
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
          description="Ghost needs templates to work with. Create your first letter to get started."
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

      {/* Dispute Type Performance (I5) */}
      {disputeTypePerformance.length > 0 && (
        <Stack gap="md">
          <Title order={3}>Dispute Type Performance</Title>
          <Paper withBorder radius="sm">
            <ScrollArea type="auto">
              <Table horizontalSpacing="md" verticalSpacing="sm" style={{ minWidth: 400 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Dispute Type</Table.Th>
                    <Table.Th>Items</Table.Th>
                    <Table.Th>Removal Rate</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {disputeTypePerformance.map((row) => (
                    <Table.Tr key={row.disputeType}>
                      <Table.Td>
                        <Text size="sm" fw={500}>{row.disputeType}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{row.total}</Text>
                      </Table.Td>
                      <Table.Td>
                        {row.rate !== null ? (
                          <Badge variant="light" color={getRateColor(row.rate)} size="sm">
                            {row.rate}%
                          </Badge>
                        ) : (
                          <Text size="xs" c="dimmed" fs="italic">Waiting on outcomes</Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        </Stack>
      )}

      {/* Round Performance (I6) */}
      {roundPerformance.length > 0 && (
        <Stack gap="md">
          <Title order={3}>Round Performance</Title>
          <Paper withBorder radius="sm" p="md">
            <Group gap="xl" wrap="wrap">
              {roundPerformance.map((row) => (
                <Stack key={row.round} gap={4} align="center" style={{ minWidth: 80 }}>
                  <Text size="xs" c="dimmed">Round {row.round}</Text>
                  <Text size="lg" fw={700}>
                    {row.rate !== null ? `${row.rate}%` : '—'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {row.resolved > 0
                      ? `${row.removed}/${row.resolved} removed`
                      : `${row.total} items`}
                  </Text>
                </Stack>
              ))}
            </Group>
          </Paper>
        </Stack>
      )}
    </Stack>
  );
}


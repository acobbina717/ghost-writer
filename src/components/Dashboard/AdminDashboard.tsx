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
  Progress,
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
import { SuccessFunnel } from './SuccessFunnel';
import { FW } from '@/theme/ghost-theme';
import { getSuccessRateColor } from '@/lib/utils';

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

interface VelocityTotal {
  userId: string;
  username: string;
  totalGenerated: number;
}

interface TeamVelocityData {
  daily: { date: string; userId: string; username: string; count: number }[];
  totals: VelocityTotal[];
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
  teamVelocity: TeamVelocityData;
}

// =============================================================================
// COMPONENT
// =============================================================================


export function AdminDashboard({ username, letters, stats, disputeTypePerformance, roundPerformance, teamVelocity }: AdminDashboardProps) {
  const maxGenerated = teamVelocity.totals.length > 0
    ? Math.max(...teamVelocity.totals.map(t => t.totalGenerated))
    : 0;
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
          color="action"
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
          ring={stats.avgSuccessRate !== null ? {
            value: stats.avgSuccessRate,
          } : undefined}
        />

        <StatCard
          label="Team Members"
          value={stats.teamMemberCount}
          subtitle="Active users"
          icon={<IconUsers size={20} />}
          color="action"
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
              <Table horizontalSpacing="md" verticalSpacing="xs" style={{ minWidth: 400 }}>
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
                        <Text size="sm" fw={FW.BODY}>{row.disputeType}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{row.total}</Text>
                      </Table.Td>
                      <Table.Td>
                        {row.rate !== null ? (
                          <Badge variant="light" color={getSuccessRateColor(row.rate)} size="sm">
                            {row.rate}%
                          </Badge>
                        ) : (
                          <Text size="xs" c="dimmed" fs="italic" fw={FW.BODY}>Waiting on outcomes</Text>
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

      {/* Round Performance — Success Funnel (I6) */}
      <SuccessFunnel roundPerformance={roundPerformance} />

      {/* Team Velocity */}
      {teamVelocity.totals.length > 0 && (
        <Stack gap="md">
          <Title order={3}>Team Velocity (30 Days)</Title>
          <Paper withBorder radius="sm">
            <ScrollArea type="auto">
              <Table horizontalSpacing="md" verticalSpacing="xs" style={{ minWidth: 400 }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Agent</Table.Th>
                    <Table.Th>Letters Generated</Table.Th>
                    <Table.Th style={{ minWidth: 200 }}>Volume</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {teamVelocity.totals.map((agent) => (
                    <Table.Tr key={agent.userId}>
                      <Table.Td>
                        <Text size="sm" fw={FW.BODY}>{agent.username}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{agent.totalGenerated}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Progress
                          value={maxGenerated > 0 ? (agent.totalGenerated / maxGenerated) * 100 : 0}
                          size="lg"
                          color="action"
                          radius="sm"
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>
        </Stack>
      )}
    </Stack>
  );
}


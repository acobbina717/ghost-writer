'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { TeamDashboard } from './TeamDashboard';
import { AdminDashboard } from './AdminDashboard';
import {
  Card,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Paper,
} from '@mantine/core';

function StatCardSkeleton() {
  return (
    <Card withBorder padding="lg">
      <Group justify="space-between" mb="xs">
        <Skeleton height={14} width={100} />
        <Skeleton height={34} width={34} radius="sm" />
      </Group>
      <Skeleton height={24} width={60} mt={4} />
      <Skeleton height={12} width={120} mt="xs" />
    </Card>
  );
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Group gap="xl" mb="md">
        {[140, 90, 80, 100, 80].map((w, i) => (
          <Skeleton key={i} height={12} width={w} />
        ))}
      </Group>
      {Array.from({ length: rows }).map((_, i) => (
        <Group key={i} gap="xl" mb="sm">
          {[140, 90, 80, 100, 80].map((w, j) => (
            <Skeleton key={j} height={14} width={w} />
          ))}
        </Group>
      ))}
    </Paper>
  );
}

function DashboardSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <Stack gap="xl">
      <div>
        <Skeleton height={32} width={280} mb="xs" />
        <Skeleton height={16} width={320} />
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: cols }} spacing="lg">
        {Array.from({ length: cols }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </SimpleGrid>

      <Stack gap="md">
        <Skeleton height={22} width={160} />
        <TableSkeleton />
      </Stack>
    </Stack>
  );
}

export default function DashboardPage() {
  const user = useQuery(api.users.getCurrentUser);
  const clientsWithDisputes = useQuery(api.clients.getClientsWithDisputes);
  const clientStats = useQuery(api.clients.getClientStats);
  const letterAnalytics = useQuery(
    api.letters.getLetterAnalytics,
    user?.role === 'admin' ? {} : 'skip'
  );
  const letterStats = useQuery(
    api.letters.getLetterStats,
    user?.role === 'admin' ? {} : 'skip'
  );
  const teamMembers = useQuery(
    api.users.getTeamMembers,
    user?.role === 'admin' ? {} : 'skip'
  );
  const disputeTypePerf = useQuery(
    api.letters.getDisputeTypePerformance,
    user?.role === 'admin' ? {} : 'skip'
  );
  const roundPerf = useQuery(
    api.letters.getRoundPerformance,
    user?.role === 'admin' ? {} : 'skip'
  );

  const isLoading =
    !user ||
    clientsWithDisputes === undefined ||
    clientStats === undefined ||
    (user?.role === 'admin' &&
      (letterAnalytics === undefined ||
        letterStats === undefined ||
        teamMembers === undefined));

  if (isLoading) {
    return <DashboardSkeleton cols={user?.role === 'admin' ? 4 : 3} />;
  }

  if (user.role === 'admin') {
    return (
      <AdminDashboard
        username={user.username}
        letters={letterAnalytics!}
        stats={{
          totalLetters: letterStats!.totalLetters,
          totalDownloadsThisMonth: letterStats!.totalDownloadsThisMonth,
          avgSuccessRate: letterStats!.avgSuccessRate,
          teamMemberCount: teamMembers!.length,
        }}
        disputeTypePerformance={disputeTypePerf ?? []}
        roundPerformance={roundPerf ?? []}
      />
    );
  }

  return (
    <TeamDashboard
      username={user.username}
      clients={clientsWithDisputes}
      stats={clientStats}
    />
  );
}

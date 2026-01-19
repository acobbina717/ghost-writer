'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { TeamDashboard } from './TeamDashboard';
import { AdminDashboard } from './AdminDashboard';
import { Center, Loader } from '@mantine/core';

export default function DashboardPage() {
  // User is guaranteed to exist by layout (redirects pending/missing users)
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

  // Single loading state for all required data
  const isLoading =
    !user ||
    clientsWithDisputes === undefined ||
    clientStats === undefined ||
    (user?.role === 'admin' &&
      (letterAnalytics === undefined ||
        letterStats === undefined ||
        teamMembers === undefined));

  if (isLoading) {
    return (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Admin Dashboard
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
      />
    );
  }

  // Team Dashboard
  return (
    <TeamDashboard
      username={user.username}
      clients={clientsWithDisputes}
      stats={clientStats}
    />
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Title, Text, Stack, Center, Loader } from '@mantine/core';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/nextjs';
import { api } from '../../../../../convex/_generated/api';
import { UsersTabs } from './UsersTabs';

export default function AdminUsersPage() {
  const router = useRouter();
  const { isLoaded: isAuthLoaded } = useAuth();
  const user = useQuery(api.users.getCurrentUser);
  const pendingUsers = useQuery(api.users.getPendingUsers);
  const teamMembers = useQuery(api.users.getTeamMembers);

  // Redirect non-admins to dashboard (only after auth is loaded)
  useEffect(() => {
    if (isAuthLoaded && user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthLoaded, user, router]);

  // Loading state
  const isLoading = !isAuthLoaded || !user || user.role !== 'admin' ||
    pendingUsers === undefined || teamMembers === undefined;

  if (isLoading) {
    return (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      <div>
        <Title order={1} mb="xs">
          User Management
        </Title>
        <Text c="dimmed">
          Approve pending signups and manage your team members.
        </Text>
      </div>

      <UsersTabs pendingUsers={pendingUsers} teamMembers={teamMembers} />
    </Stack>
  );
}

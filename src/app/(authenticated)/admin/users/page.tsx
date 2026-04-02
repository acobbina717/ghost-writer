'use client';

import { Title, Text, Stack, Center, Loader } from '@mantine/core';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { UsersTabs } from './UsersTabs';

export default function AdminUsersPage() {
  const pendingUsers = useQuery(api.users.getPendingUsers);
  const teamMembers = useQuery(api.users.getTeamMembers);

  if (pendingUsers === undefined || teamMembers === undefined) {
    return <Center h="50vh"><Loader size="lg" /></Center>;
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

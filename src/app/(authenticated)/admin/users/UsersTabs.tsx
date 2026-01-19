'use client';

import { Tabs } from '@mantine/core';
import { IconUserCheck, IconUserX, IconUsers } from '@tabler/icons-react';
import { PendingUsersTable } from './PendingUsersTable';
import { TeamMembersTable } from './TeamMembersTable';
import { EmptyState } from '@/components/EmptyState';
import type { ConvexUser } from '@/lib/convex-types';

interface UsersTabsProps {
  pendingUsers: ConvexUser[];
  teamMembers: ConvexUser[];
}

export function UsersTabs({ pendingUsers, teamMembers }: UsersTabsProps) {
  return (
    <Tabs defaultValue="pending">
      <Tabs.List>
        <Tabs.Tab value="pending" leftSection={<IconUserCheck size={16} />}>
          Pending Approval ({pendingUsers.length})
        </Tabs.Tab>
        <Tabs.Tab value="team" leftSection={<IconUserX size={16} />}>
          Team Members ({teamMembers.length})
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="pending" pt="md">
        {pendingUsers.length === 0 ? (
          <EmptyState
            icon={<IconUserCheck size={48} />}
            title="No Pending Users"
            description="No users are awaiting approval. New signups will appear here for verification."
          />
        ) : (
          <PendingUsersTable users={pendingUsers} />
        )}
      </Tabs.Panel>

      <Tabs.Panel value="team" pt="md">
        {teamMembers.length === 0 ? (
          <EmptyState
            icon={<IconUsers size={48} />}
            title="No Team Members"
            description="No team members yet. Approve pending users to add them to your team."
          />
        ) : (
          <TeamMembersTable users={teamMembers} />
        )}
      </Tabs.Panel>
    </Tabs>
  );
}


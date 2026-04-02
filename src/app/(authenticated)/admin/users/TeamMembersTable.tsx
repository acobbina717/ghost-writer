'use client';

import { Table, Group, Text, Badge, ActionIcon, Tooltip, Card } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUserMinus } from '@tabler/icons-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { getSocialIcon, formatDate } from '@/lib/utils';
import type { ConvexUser } from '@/lib/convex-types';
import { FW } from '@/theme/ghost-theme';

interface TeamMembersTableProps {
  users: ConvexUser[];
}

export function TeamMembersTable({ users }: TeamMembersTableProps) {
  const demoteUser = useMutation(api.users.demoteUser);

  const handleDemote = async (userId: string, userName: string) => {
    try {
      await demoteUser({ userId: userId as Id<"users"> });
      notifications.show({
        title: 'User Demoted',
        message: `${userName}'s team access has been revoked.`,
        color: 'orange',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to demote user',
        color: 'red',
      });
    }
  };

  return (
    <Card withBorder padding="md">
      <Table.ScrollContainer minWidth={600}>
        <Table verticalSpacing="xs" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Username</Table.Th> 
              <Table.Th>Email</Table.Th>
              <Table.Th>Social Handle</Table.Th>
              <Table.Th>Member Since</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user._id}>
                <Table.Td>
                  <Text fw={FW.BODY}>{user.username}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {user.email}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    leftSection={getSocialIcon(user.socialPlatform, 14)}
                  >
                    {user.socialHandle}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {formatDate(new Date(user.createdAt))}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Tooltip label="Revoke Access">
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDemote(user._id, user.username)}
                      >
                        <IconUserMinus size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}

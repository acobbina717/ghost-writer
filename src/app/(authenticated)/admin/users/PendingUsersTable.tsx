'use client';

import { Table, Group, Text, Badge, ActionIcon, Tooltip, Card } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { getSocialIcon, formatDate } from '@/lib/utils';
import type { ConvexUser } from '@/lib/convex-types';

interface PendingUsersTableProps {
  users: ConvexUser[];
}

export function PendingUsersTable({ users }: PendingUsersTableProps) {
  const promoteUser = useMutation(api.users.promoteUser);
  const denyUser = useMutation(api.users.denyUser);

  const handleApprove = async (userId: string, userName: string) => {
    try {
      await promoteUser({ userId: userId as Id<"users"> });
      notifications.show({
        title: 'User Approved',
        message: `${userName} has been granted team access.`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to approve user',
        color: 'red',
      });
    }
  };

  const handleDeny = async (userId: string, userName: string) => {
    try {
      await denyUser({ userId: userId as Id<"users"> });
      notifications.show({
        title: 'User Denied',
        message: `${userName}'s access request has been denied.`,
        color: 'orange',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to deny user',
        color: 'red',
      });
    }
  };

  return (
    <Card withBorder padding="md">
      <Table.ScrollContainer minWidth={600}>
        <Table verticalSpacing="sm" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Username</Table.Th> 
              <Table.Th>Email</Table.Th>
              <Table.Th>Social Handle</Table.Th>
              <Table.Th>Signed Up</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user._id}>
                <Table.Td>
                  <Text fw={500}>{user.username}</Text>
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
                    {formatDate(new Date(user.createdAt), { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end">
                    <Tooltip label="Approve User">
                      <ActionIcon
                        variant="filled"
                        color="green"
                        onClick={() => handleApprove(user._id, user.username)}
                      >
                        <IconCheck size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Deny User">
                      <ActionIcon
                        variant="filled"
                        color="red"
                        onClick={() => handleDeny(user._id, user.username)}
                      >
                        <IconX size={16} />
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

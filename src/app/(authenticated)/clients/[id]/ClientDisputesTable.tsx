'use client';

import { Table, Badge, Text, Group, ThemeIcon, Paper, Button, Select } from '@mantine/core';
import { IconCircle, IconFileText } from '@tabler/icons-react';
import type { ConvexDisputeItem } from '@/lib/convex-types';
import { getCraInfo, DISPUTE_STATUS_COLORS } from '@/lib/constants';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { notifications } from '@mantine/notifications';
import { Id } from '../../../../../convex/_generated/dataModel';

interface ClientDisputesTableProps {
  items: ConvexDisputeItem[];
  onGenerateLetter: (disputeId: string) => void;
}


export function ClientDisputesTable({ items, onGenerateLetter }: ClientDisputesTableProps) {
  const updateDisputeStatus = useMutation(api.clients.updateDisputeStatus);

  const handleStatusChange = async (disputeId: string, newStatus: 'pending' | 'removed' | 'verified') => {
    try {
      await updateDisputeStatus({
        disputeId: disputeId as Id<'disputeItems'>,
        status: newStatus,
      });
      notifications.show({
        title: 'Status Updated',
        message: `Dispute status changed to ${newStatus}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update dispute status',
        color: 'red',
      });
    }
  };

  return (
    <Paper withBorder radius="sm">
      <Table horizontalSpacing="md" verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Dispute Type</Table.Th>
            <Table.Th>Creditor</Table.Th>
            <Table.Th>Account #</Table.Th>
            <Table.Th>CRA</Table.Th>
            <Table.Th>Round</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item) => {
            const cra = getCraInfo(item.craTarget);
            return (
              <Table.Tr key={item._id}>
                <Table.Td>
                  <Text size="sm" fw={500}>
                    {item.disputeType}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{item.creditorName ?? '—'}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed" ff="monospace">
                    {item.accountNumber ?? '—'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color={cra.color} size="sm">
                    {cra.label}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ThemeIcon variant="light" size="xs" radius="xl" color="gray">
                      <IconCircle size={8} fill="currentColor" />
                    </ThemeIcon>
                    <Text size="sm">Round {item.currentRound}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    value={item.status}
                    onChange={(value) => value && handleStatusChange(item._id, value as 'pending' | 'removed' | 'verified')}
                    data={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'removed', label: 'Removed' },
                      { value: 'verified', label: 'Verified' },
                    ]}
                    w={120}
                  />
                </Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconFileText size={14} />}
                    onClick={() => onGenerateLetter(item._id)}
                  >
                    Generate
                  </Button>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}


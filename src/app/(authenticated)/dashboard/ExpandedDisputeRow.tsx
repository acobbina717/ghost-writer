'use client';

import { Table, Badge, Text, Group, ThemeIcon, Box, Loader, Center } from '@mantine/core';
import { IconCircle } from '@tabler/icons-react';
import type { ConvexDisputeItem } from '@/lib/convex-types';
import { getCraInfo, DISPUTE_STATUS_COLORS } from '@/lib/constants';

// =============================================================================
// TYPES
// =============================================================================

interface ExpandedDisputeRowProps {
  items: ConvexDisputeItem[];
  isLoading?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ExpandedDisputeRow({ items, isLoading }: ExpandedDisputeRowProps) {
  if (isLoading) {
    return (
      <Center py="md">
        <Loader size="sm" />
      </Center>
    );
  }

  if (items.length === 0) {
    return (
      <Box py="md" px="lg">
        <Text c="dimmed" size="sm" ta="center">
          No dispute items for this client.
        </Text>
      </Box>
    );
  }

  return (
    <Box
      py="xs"
      px="md"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderTop: `1px solid var(--border-subtle)`,
      }}
    >
      <Table
        horizontalSpacing="sm"
        verticalSpacing="xs"
        highlightOnHover={false}
        withRowBorders={false}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Dispute Type</Table.Th>
            <Table.Th>Creditor</Table.Th>
            <Table.Th>CRA</Table.Th>
            <Table.Th>Round</Table.Th>
            <Table.Th>Status</Table.Th>
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
                  <Text size="sm" c="dimmed">
                    {item.creditorName ?? '—'}
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
                  <Badge
                    variant="light"
                    color={DISPUTE_STATUS_COLORS[item.status] ?? 'gray'}
                    size="sm"
                    tt="capitalize"
                  >
                    {item.status}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Box>
  );
}


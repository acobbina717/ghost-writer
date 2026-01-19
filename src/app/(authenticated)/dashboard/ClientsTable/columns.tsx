import type { ColumnDef } from '@tanstack/react-table';
import { Text, ActionIcon, Tooltip, Box, Badge, Anchor } from '@mantine/core';
import { IconChevronRight, IconChevronDown, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import type { ClientWithDisputes } from '@/lib/convex-types';
import { AlertBadge } from './AlertBadge';


/**
 * @param onDeleteClick - Callback when delete action is triggered
 * @returns Array of column definitions for TanStack Table
 */

export function createColumns(
  onDeleteClick: (client: ClientWithDisputes) => void
): ColumnDef<ClientWithDisputes>[] {
  return [
    // Expand/collapse toggle column
    {
      id: 'expand',
      header: () => null,
      cell: ({ row }) => (
        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={row.getToggleExpandedHandler()}
          style={{ cursor: 'pointer' }}
        >
          {row.getIsExpanded() ? (
            <IconChevronDown size={16} />
          ) : (
            <IconChevronRight size={16} />
          )}
        </ActionIcon>
      ),
      size: 40,
    },

    // Client name with link
    {
      accessorKey: 'name',
      header: 'Client Name',
      cell: ({ row }) => {
        const client = row.original;
        return (
          <Anchor
            component={Link}
            href={`/clients/${client._id}`}
            size="sm"
            fw={500}
            onClick={(e) => e.stopPropagation()}
            style={{ textDecoration: 'none' }}
          >
            {client.firstName} {client.lastName}
          </Anchor>
        );
      },
    },

    // Days active with alert badge
    {
      accessorKey: 'daysActive',
      header: 'Days Active',
      cell: ({ row }) => {
        const { daysActive, alertLevel } = row.original;
        return (
          <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text size="sm">{daysActive}</Text>
            <AlertBadge alertLevel={alertLevel} daysActive={daysActive} />
          </Box>
        );
      },
    },

    // Total disputes count
    {
      accessorKey: 'totalDisputes',
      header: 'Total Disputes',
      cell: ({ getValue }) => (
        <Text size="sm">{getValue() as number}</Text>
      ),
    },

    // Pending disputes with badge
    {
      accessorKey: 'pendingDisputes',
      header: 'Pending Items',
      cell: ({ getValue }) => {
        const pending = getValue() as number;
        return (
          <Badge variant="light" color={pending > 0 ? 'yellow' : 'gray'} size="sm">
            {pending}
          </Badge>
        );
      },
    },

    // Actions column (delete)
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <Tooltip label="Delete client" withArrow>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(row.original);
            }}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      ),
      size: 40,
    },
  ];
}

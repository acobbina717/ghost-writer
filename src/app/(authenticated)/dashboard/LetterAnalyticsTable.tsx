'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  Table,
  Badge,
  Text,
  Paper,
  Group,
} from '@mantine/core';
import { IconArrowUp, IconArrowDown, IconArrowsSort } from '@tabler/icons-react';
import type { LetterAnalytics } from '@/lib/convex-types';

// =============================================================================
// TYPES
// =============================================================================

interface LetterAnalyticsTableProps {
  letters: LetterAnalytics[];
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function getSuccessRateColor(rate: number | null): string {
  if (rate === null) return 'gray';
  if (rate >= 70) return 'green';
  if (rate >= 40) return 'yellow';
  return 'red';
}

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') {
    return <IconArrowUp size={14} />;
  }
  if (isSorted === 'desc') {
    return <IconArrowDown size={14} />;
  }
  return <IconArrowsSort size={14} style={{ opacity: 0.3 }} />;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LetterAnalyticsTable({ letters }: LetterAnalyticsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<LetterAnalytics>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Letter Title',
        cell: ({ getValue }) => (
          <Text size="sm" fw={500}>
            {getValue() as string}
          </Text>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'totalDownloads',
        header: 'Downloads',
        cell: ({ getValue }) => (
          <Text size="sm">{getValue() as number}</Text>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'uniqueUsers',
        header: 'Unique Users',
        cell: ({ getValue }) => (
          <Text size="sm">{getValue() as number}</Text>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'successRate',
        header: 'Success Rate',
        cell: ({ getValue }) => {
          const rate = getValue() as number | null;
          return (
            <Badge
              variant="light"
              color={getSuccessRateColor(rate)}
              size="sm"
            >
              {rate !== null ? `${rate}%` : '—'}
            </Badge>
          );
        },
        enableSorting: true,
        sortUndefined: 'last',
      },
      {
        accessorKey: 'lastUsed',
        header: 'Last Used',
        cell: ({ getValue }) => (
          <Text size="sm" c="dimmed">
            {formatDate(getValue() as Date | null)}
          </Text>
        ),
        enableSorting: true,
        sortUndefined: 'last',
      },
    ],
    []
  );

  const table = useReactTable({
    data: letters,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleRowClick = (letterId: string) => {
    router.push(`/admin/letters/${letterId}`);
  };

  return (
    <Paper withBorder radius="sm">
      <Table horizontalSpacing="md" verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.Th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{
                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                >
                  <Group gap="xs" wrap="nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <SortIcon isSorted={header.column.getIsSorted()} />
                    )}
                  </Group>
                </Table.Th>
              ))}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={columns.length}>
                <Text c="dimmed" ta="center" py="xl">
                  No letters found.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Table.Tr
                key={row.id}
                style={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <Table.Td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}


'use client';

import { useMemo, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
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
  ScrollArea,
  ActionIcon,
} from '@mantine/core';
import { IconArrowUp, IconArrowDown, IconArrowsSort, IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import type { LetterAnalytics } from '@/lib/convex-types';
import { getCraInfo } from '@/lib/constants';
import { FW } from '@/theme/ghost-theme';
import { formatDate as formatDateUtil, getSuccessRateColor } from '@/lib/utils';

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
  return formatDateUtil(new Date(date));
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
        id: 'expand',
        header: () => null,
        cell: ({ row }) => {
          const hasCraData = row.original.perCraStats && Object.keys(row.original.perCraStats).length > 0;
          if (!hasCraData) return null;
          return (
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); row.toggleExpanded(); }}
              aria-label={row.getIsExpanded() ? 'Collapse CRA breakdown' : 'Expand CRA breakdown'}
            >
              {row.getIsExpanded()
                ? <IconChevronDown size={14} />
                : <IconChevronRight size={14} />}
            </ActionIcon>
          );
        },
        size: 30,
        enableSorting: false,
      },
      {
        accessorKey: 'title',
        header: 'Letter Title',
        cell: ({ getValue }) => (
          <Text size="sm" fw={FW.BODY}>
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
        cell: ({ getValue, row }) => {
          const rate = getValue() as number | null;
          const hasUsage = (row.original.totalDownloads ?? 0) > 0;
          if (rate === null && hasUsage) {
            return (
              <Text size="xs" c="dimmed" fs="italic">
                Waiting on outcomes
              </Text>
            );
          }
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
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) =>
      row.original.perCraStats != null && Object.keys(row.original.perCraStats).length > 0,
  });

  const handleRowClick = (letterId: string) => {
    router.push(`/admin/letters/${letterId}`);
  };

  return (
    <Paper withBorder radius="sm">
      <ScrollArea type="auto">
      <Table horizontalSpacing="md" verticalSpacing="xs" highlightOnHover style={{ minWidth: 600 }}>
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
              <Fragment key={row.id}>
                <Table.Tr
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Td>
                  ))}
                </Table.Tr>
                {row.getIsExpanded() && (
                  <Table.Tr>
                    <Table.Td colSpan={columns.length} style={{ background: 'var(--bg-elevated)', padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md) var(--mantine-spacing-sm) var(--mantine-spacing-xl)' }}>
                      <Group gap="lg" wrap="wrap">
                        {Object.entries(row.original.perCraStats).map(([cra, stats]) => {
                          const craInfo = getCraInfo(cra);
                          return (
                            <Group key={cra} gap="xs">
                              <Badge variant="light" color={craInfo.color} size="xs">
                                {craInfo.label}
                              </Badge>
                              <Text size="xs" c="dimmed">
                                {stats.rate !== null
                                  ? `${stats.rate}% (${stats.removed}/${stats.resolved})`
                                  : 'No outcomes'}
                              </Text>
                            </Group>
                          );
                        })}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Fragment>
            ))
          )}
        </Table.Tbody>
      </Table>
      </ScrollArea>
    </Paper>
  );
}


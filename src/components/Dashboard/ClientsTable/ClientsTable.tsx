'use client';
'use no memo';

import { useState, Fragment, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ExpandedState,
  type SortingState,
} from '@tanstack/react-table';
import { Table, Text, Paper, ScrollArea, TextInput, Group, ActionIcon, Select } from '@mantine/core';
import { IconSearch, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useConvex } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import type { ClientWithDisputes } from '@/lib/convex-types';
import { ExpandedDisputeRow } from '../ExpandedDisputeRow';
import { DeleteClientModal } from '../DeleteClientModal';
import { createColumns } from './columns';
import type { ClientsTableProps, DisputeItemsCache } from './types';

const PAGE_SIZE_OPTIONS = ['10', '25', '50'];

export function ClientsTable({ clients }: ClientsTableProps) {
  const convex = useConvex();
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [disputeItemsCache, setDisputeItemsCache] = useState<DisputeItemsCache>({});
  const [clientToDelete, setClientToDelete] = useState<ClientWithDisputes | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const filteredData = useMemo(() => {
    if (!search.trim()) return clients;

    const q = search.toLowerCase().trim();
    return clients.filter((c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const handleDeleteClick = useCallback((client: ClientWithDisputes) => {
    setClientToDelete(client);
    openDeleteModal();
  }, [openDeleteModal]);

  const columns = useMemo(() => createColumns(handleDeleteClick), [handleDeleteClick]);

  const loadDisputeItems = useCallback(async (clientId: string) => {
    if (disputeItemsCache[clientId]) return;

    setDisputeItemsCache((prev) => ({
      ...prev,
      [clientId]: { items: [], loading: true },
    }));

    try {
      const items = await convex.query(api.clients.getDisputeItemsByClient, {
        clientId: clientId as Id<'clients'>,
      });
      setDisputeItemsCache((prev) => ({
        ...prev,
        [clientId]: { items: items || [], loading: false },
      }));
    } catch (error) {
      console.error('Failed to load dispute items:', error);
      setDisputeItemsCache((prev) => ({
        ...prev,
        [clientId]: { items: [], loading: false },
      }));
    }
  }, [convex, disputeItemsCache]);

  const handleExpandedChange = useCallback((updater: ExpandedState | ((old: ExpandedState) => ExpandedState)) => {
    const newExpanded = typeof updater === 'function' ? updater(expanded) : updater;
    setExpanded(newExpanded);

    Object.keys(newExpanded).forEach((index) => {
      if (newExpanded[index as keyof typeof newExpanded]) {
        const rowIndex = parseInt(index, 10);
        const client = filteredData[rowIndex];
        if (client) {
          loadDisputeItems(client._id);
        }
      }
    });
  }, [expanded, filteredData, loadDisputeItems]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { expanded, sorting },
    onExpandedChange: handleExpandedChange,
    onSortingChange: setSorting,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <>
      <Paper withBorder radius="sm">
        <TextInput
          placeholder="Search clients..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          m="md"
          mb={0}
          styles={{ input: { backgroundColor: 'var(--bg-inset)', borderColor: 'var(--border-default)' } }}
        />
        <ScrollArea type="auto">
        <Table horizontalSpacing="md" verticalSpacing="xs" highlightOnHover style={{ minWidth: 600 }}>
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Th
                    key={header.id}
                    style={{
                      width: header.getSize() !== 150 ? header.getSize() : undefined,
                      cursor: header.column.getCanSort() ? 'pointer' : undefined,
                      userSelect: header.column.getCanSort() ? 'none' : undefined,
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : (
                        <Group gap="xs" wrap="nowrap">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && <Text size="xs">↑</Text>}
                          {header.column.getIsSorted() === 'desc' && <Text size="xs">↓</Text>}
                        </Group>
                      )}
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
                    No clients found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const clientId = row.original._id;
                const cache = disputeItemsCache[clientId];

                return (
                  <Fragment key={row.id}>
                    <Table.Tr
                      style={{
                        cursor: 'pointer',
                        backgroundColor: row.getIsExpanded() ? 'var(--bg-elevated)' : undefined,
                      }}
                      onClick={row.getToggleExpandedHandler()}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <Table.Td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                    {row.getIsExpanded() && (
                      <Table.Tr>
                        <Table.Td colSpan={columns.length} p={0}>
                          <ExpandedDisputeRow
                            items={cache?.items ?? []}
                            isLoading={cache?.loading ?? true}
                            clientId={clientId}
                          />
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </Table.Tbody>
        </Table>
        </ScrollArea>

        {table.getPageCount() > 1 && (
          <Group justify="space-between" p="md" pt="sm">
            <Group gap="xs">
              <Text size="xs" c="dimmed">Rows per page:</Text>
              <Select
                size="xs"
                w={70}
                data={PAGE_SIZE_OPTIONS}
                value={String(table.getState().pagination.pageSize)}
                onChange={(val) => table.setPageSize(Number(val))}
                allowDeselect={false}
              />
            </Group>
            <Group gap="xs">
              <Text size="xs" c="dimmed">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                –
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  filteredData.length
                )}
                {' '}of {filteredData.length}
              </Text>
              <ActionIcon
                variant="subtle"
                size="sm"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <IconChevronLeft size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="sm"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>
          </Group>
        )}
      </Paper>

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <DeleteClientModal
          opened={deleteModalOpened}
          onClose={() => {
            closeDeleteModal();
            setClientToDelete(null);
          }}
          client={{
            id: clientToDelete._id,
            firstName: clientToDelete.firstName,
            lastName: clientToDelete.lastName,
            daysActive: clientToDelete.daysActive,
            totalDisputes: clientToDelete.totalDisputes,
          }}
        />
      )}
    </>
  );
}

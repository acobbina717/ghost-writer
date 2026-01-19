'use client';
'use no memo';

import { useState, Fragment, useCallback, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ExpandedState,
} from '@tanstack/react-table';
import { Table, Text, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useConvex } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import type { ClientWithDisputes } from '@/lib/convex-types';
import { ExpandedDisputeRow } from '../ExpandedDisputeRow';
import { DeleteClientModal } from '../DeleteClientModal';
import { createColumns } from './columns';
import type { ClientsTableProps, DisputeItemsCache } from './types';


export function ClientsTable({ clients, filter = 'all' }: ClientsTableProps) {
  const convex = useConvex();
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [disputeItemsCache, setDisputeItemsCache] = useState<DisputeItemsCache>({});
  const [clientToDelete, setClientToDelete] = useState<ClientWithDisputes | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const filteredData = useMemo(() => {
    return filter === 'pending'
      ? clients.filter((c) => c.pendingDisputes > 0)
      : clients;
  }, [clients, filter]);

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
    state: { expanded },
    onExpandedChange: handleExpandedChange,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <>
      <Paper withBorder radius="sm">
        <Table horizontalSpacing="md" verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Th
                    key={header.id}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                    {filter === 'pending'
                      ? 'No clients with pending disputes.'
                      : 'No clients found.'}
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

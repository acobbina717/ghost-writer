'use client';

import { useState } from 'react';
import { Table, Badge, Text, Group, ThemeIcon, Paper, Button, Select, ScrollArea, Modal, TextInput, Stack, Checkbox } from '@mantine/core';
import { IconCircle, IconFileText, IconEdit, IconArrowUp } from '@tabler/icons-react';
import type { ConvexDisputeItem } from '@/lib/convex-types';
import { getCraInfo } from '@/lib/constants';
import { FW } from '@/theme/ghost-theme';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { notifications } from '@mantine/notifications';
import type { Id } from '../../../../../convex/_generated/dataModel';
import type { PrePopulatedData } from './DisputeGenerateModal';

interface ClientDisputesTableProps {
  items: ConvexDisputeItem[];
  onOpenGenerateModal: (data: PrePopulatedData) => void;
}


export function ClientDisputesTable({ items, onOpenGenerateModal }: ClientDisputesTableProps) {
  const updateDisputeStatus = useMutation(api.clients.updateDisputeStatus);
  const updateDisputeItem = useMutation(api.clients.updateDisputeItem);
  const incrementRound = useMutation(api.clients.incrementDisputeRound);
  const bulkUpdateStatus = useMutation(api.clients.bulkUpdateDisputeStatus);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<ConvexDisputeItem | null>(null);
  const [editCreditor, setEditCreditor] = useState('');
  const [editAccount, setEditAccount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i._id)));
    }
  };

  const handleBulkStatusChange = async (status: 'pending' | 'removed' | 'verified' | 'no_change') => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateStatus({
        disputeIds: Array.from(selectedIds) as Id<'disputeItems'>[],
        status,
      });
      notifications.show({
        title: 'Bulk Update',
        message: `${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''} set to ${status}`,
        color: 'green',
      });
      setSelectedIds(new Set());
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update items',
        color: 'red',
      });
    }
  };

  const handleAdvanceRound = async (disputeId: string) => {
    const item = items.find(i => i._id === disputeId);
    const nextRound = item ? item.currentRound + 1 : null;
    try {
      await incrementRound({ disputeId: disputeId as Id<'disputeItems'> });
      notifications.show({
        title: 'Round Advanced',
        message: nextRound
          ? `Round ${nextRound} started. Ghost is ready for the next letter.`
          : 'Ghost advanced to the next round.',
        color: 'blue',
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to advance round',
        color: 'red',
      });
    }
  };

  const openEditModal = (item: ConvexDisputeItem) => {
    setEditingItem(item);
    setEditCreditor(item.creditorName ?? '');
    setEditAccount(item.accountNumber ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      await updateDisputeItem({
        disputeId: editingItem._id as Id<'disputeItems'>,
        creditorName: editCreditor,
        accountNumber: editAccount,
      });
      notifications.show({
        title: 'Updated',
        message: 'Dispute item updated successfully',
        color: 'green',
      });
      setEditingItem(null);
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update dispute item',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (disputeId: string, newStatus: 'pending' | 'removed' | 'verified' | 'no_change') => {
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
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to update dispute status',
        color: 'red',
      });
    }
  };

  return (
    <>
    <Paper withBorder radius="sm">
      {selectedIds.size > 0 && (
        <Group gap="sm" p="sm" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <Text size="sm" fw={FW.BODY}>{selectedIds.size} selected</Text>
          <Button size="xs" variant="light" color="yellow" onClick={() => handleBulkStatusChange('pending')}>
            Set Pending
          </Button>
          <Button size="xs" variant="light" color="green" onClick={() => handleBulkStatusChange('removed')}>
            Set Removed
          </Button>
          <Button size="xs" variant="light" color="blue" onClick={() => handleBulkStatusChange('verified')}>
            Set Verified
          </Button>
          <Button size="xs" variant="light" color="gray" onClick={() => handleBulkStatusChange('no_change')}>
            Set No Change
          </Button>
          <Button size="xs" variant="subtle" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </Group>
      )}
      <ScrollArea type="auto">
      <Table horizontalSpacing="md" verticalSpacing="xs" highlightOnHover style={{ minWidth: 700 }}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox
                size="xs"
                checked={items.length > 0 && selectedIds.size === items.length}
                indeterminate={selectedIds.size > 0 && selectedIds.size < items.length}
                onChange={toggleSelectAll}
              />
            </Table.Th>
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
                  <Checkbox
                    size="xs"
                    checked={selectedIds.has(item._id)}
                    onChange={() => toggleSelect(item._id)}
                  />
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={FW.BODY}>
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
                    {item.status === 'pending' && (
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color="blue"
                        px={4}
                        onClick={() => handleAdvanceRound(item._id)}
                        title="Advance to next round"
                      >
                        <IconArrowUp size={12} />
                      </Button>
                    )}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    value={item.status}
                    onChange={(value) => value && handleStatusChange(item._id, value as 'pending' | 'removed' | 'verified' | 'no_change')}
                    data={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'removed', label: 'Removed' },
                      { value: 'verified', label: 'Verified' },
                      { value: 'no_change', label: 'No Change' },
                    ]}
                    w={120}
                  />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="subtle"
                      px="xs"
                      onClick={() => openEditModal(item)}
                      aria-label="Edit dispute item"
                    >
                      <IconEdit size={14} />
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconFileText size={14} />}
                      onClick={() => {
                        const relatedItems = items.filter(
                          d => d.craTarget === item.craTarget && d.disputeType === item.disputeType,
                        );
                        onOpenGenerateModal({
                          disputeType: item.disputeType,
                          craTargets: [item.craTarget],
                          items: relatedItems,
                          currentRound: item.currentRound,
                        });
                      }}
                    >
                      Generate
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
      </ScrollArea>
    </Paper>

    <Modal
      opened={!!editingItem}
      onClose={() => setEditingItem(null)}
      title="Edit Dispute Item"
      size="sm"
    >
      <Stack gap="md">
        <TextInput
          label="Creditor Name"
          value={editCreditor}
          onChange={(e) => setEditCreditor(e.currentTarget.value)}
        />
        <TextInput
          label="Account Number"
          value={editAccount}
          onChange={(e) => setEditAccount(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setEditingItem(null)}>Cancel</Button>
          <Button onClick={handleSaveEdit} loading={isSaving}>Save</Button>
        </Group>
      </Stack>
    </Modal>
    </>
  );
}


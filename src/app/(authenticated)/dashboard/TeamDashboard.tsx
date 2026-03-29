'use client';

import { useState } from 'react';
import {
  Title,
  Text,
  SimpleGrid,
  Stack,
  Group,
  Button,
  SegmentedControl,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconUsers,
  IconClock,
  IconAlertTriangle,
  IconUserPlus,
  IconChartBar,
} from '@tabler/icons-react';
import type { ClientWithDisputes } from '@/lib/convex-types';
import { ClientsTable } from './ClientsTable';
import { ClientFormModal } from './ClientFormModal';
import { EmptyState } from '@/components/EmptyState';
import { StatCard } from '@/components/StatCard';
import { PURGE_ENABLED } from '@/lib/constants';

// =============================================================================
// TYPES
// =============================================================================

interface TeamDashboardProps {
  username: string;
  clients: ClientWithDisputes[];
  stats: {
    totalClients: number;
    pendingItems: number;
    approachingPurge: number;
    portfolioSuccessRate: number | null;
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TeamDashboard({ username, clients, stats }: TeamDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);

  return (
    <>
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1} mb="xs">
            Welcome back, {username}
          </Title>
          <Text c="dimmed">
            Ghost is ready. Pick up where you left off.
          </Text>
        </div>

        {/* Stat Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: PURGE_ENABLED ? 4 : 3 }} spacing="lg">
          <StatCard
            label="Total Clients"
            value={stats.totalClients}
            subtitle="Active profiles"
            icon={<IconUsers size={20} />}
          />

          <StatCard
            label="Pending Items"
            value={stats.pendingItems}
            subtitle="Awaiting resolution"
            icon={<IconClock size={20} />}
            color="yellow"
          />

          <StatCard
            label="Portfolio Success Rate"
            value={stats.portfolioSuccessRate !== null ? `${stats.portfolioSuccessRate}%` : '—'}
            subtitle="Items removed across all clients"
            icon={<IconChartBar size={20} />}
            color={
              stats.portfolioSuccessRate === null
                ? 'gray'
                : stats.portfolioSuccessRate >= 70
                ? 'green'
                : stats.portfolioSuccessRate >= 40
                ? 'yellow'
                : 'gray'
            }
          />

          {PURGE_ENABLED && (
            <StatCard
              label="Approaching Purge"
              value={stats.approachingPurge}
              subtitle="80+ days active"
              icon={<IconAlertTriangle size={20} />}
              color={stats.approachingPurge > 0 ? 'red' : 'gray'}
            />
          )}
        </SimpleGrid>

        {/* Clients Table or Empty State */}
        {clients.length === 0 ? (
          <EmptyState
            icon={<IconUsers size={48} />}
            title="No Clients Yet"
            description="Ghost is standing by. Add your first client to get started."
            action={{
              label: 'Add Client',
              onClick: openAddModal,
              icon: <IconUserPlus size={16} />,
            }}
          />
        ) : (
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Title order={3}>Clients</Title>
              <Group gap="sm">
                <SegmentedControl
                  size="xs"
                  value={filter}
                  onChange={(value) => setFilter(value as 'all' | 'pending')}
                  data={[
                    { label: 'All', value: 'all' },
                    { label: `Pending (${stats.pendingItems})`, value: 'pending' },
                  ]}
                />
                <Button
                  leftSection={<IconUserPlus size={16} />}
                  onClick={openAddModal}
                >
                  Add Client
                </Button>
              </Group>
            </Group>
            <ClientsTable clients={clients} filter={filter} />
          </Stack>
        )}
      </Stack>

      {/* Add Client Modal */}
      <ClientFormModal
        opened={addModalOpened}
        onClose={closeAddModal}
        mode="create"
      />
    </>
  );
}

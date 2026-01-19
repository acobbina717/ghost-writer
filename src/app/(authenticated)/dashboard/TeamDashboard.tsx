'use client';

import { useState } from 'react';
import {
  Title,
  Text,
  SimpleGrid,
  Stack,
  Group,
  Button,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconUsers,
  IconClock,
  IconAlertTriangle,
  IconUserPlus,
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
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TeamDashboard({ username, clients, stats }: TeamDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'pending'>('all');
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);

  const handlePendingClick = () => {
    setFilter((prev) => (prev === 'pending' ? 'all' : 'pending'));
  };

  return (
    <>
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1} mb="xs">
            Welcome back, {username}
          </Title>
          <Text c="dimmed">
            Generate dispute letters and track your clients.
          </Text>
        </div>

        {/* Stat Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: PURGE_ENABLED ? 3 : 2 }} spacing="lg">
          <StatCard
            label="Total Clients"
            value={stats.totalClients}
            subtitle="Active profiles"
            icon={<IconUsers size={20} />}
          />

          <StatCard
            label="Pending Items"
            value={stats.pendingItems}
            subtitle={filter === 'pending' ? 'Click to show all' : 'Click to filter'}
            icon={<IconClock size={20} />}
            color="yellow"
            onClick={handlePendingClick}
            active={filter === 'pending'}
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
            description="Add your first client to start generating dispute letters."
            action={{
              label: 'Add Client',
              onClick: openAddModal,
              icon: <IconUserPlus size={16} />,
            }}
          />
        ) : (
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Title order={3}>
                {filter === 'pending' ? 'Clients with Pending Items' : 'All Clients'}
              </Title>
              <Group gap="sm">
                {filter === 'pending' && (
                  <Button variant="subtle" size="xs" onClick={() => setFilter('all')}>
                    Show All
                  </Button>
                )}
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

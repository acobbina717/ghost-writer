'use client';

import { useState, useMemo } from 'react';
import {
  Title,
  Text,
  SimpleGrid,
  Stack,
  Group,
  Button,
  Tabs,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconUsers,
  IconClock,
  IconAlertTriangle,
  IconUserPlus,
  IconChartBar,
} from '@tabler/icons-react';
import type { ClientWithDisputes, ClientStats } from '@/lib/convex-types';
import { ClientsTable } from './ClientsTable';
import { ClientFormModal } from './ClientFormModal';
import { EmptyState } from '@/components/EmptyState';
import { StatCard } from '@/components/StatCard';
import { PURGE_ENABLED } from '@/lib/constants';

// =============================================================================
// TYPES
// =============================================================================

type UrgencyTier = 'all' | 'needs-intake' | 'ready-round-2' | 'drafts' | 'waiting' | 'in-progress';

interface TeamDashboardProps {
  username: string;
  clients: ClientWithDisputes[];
  stats: ClientStats;
  draftClientIds: string[];
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TeamDashboard({ username, clients, stats, draftClientIds }: TeamDashboardProps) {
  const [activeTab, setActiveTab] = useState<UrgencyTier>('all');
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);

  const draftIdSet = useMemo(() => new Set(draftClientIds), [draftClientIds]);

  const [now] = useState(() => Date.now());
  const tiers = useMemo(() => {
    const THIRTY_DAYS_MS = 30 * 86_400_000;

    const needsIntake = clients.filter((c) => c.totalDisputes === 0);
    const drafts = clients.filter((c) => draftIdSet.has(c._id));
    const readyRound2 = clients.filter(
      (c) =>
        c.pendingDisputes === 0 &&
        c.totalDisputes > 0 &&
        c.lastDisputeUpdatedAt !== null &&
        now - c.lastDisputeUpdatedAt >= THIRTY_DAYS_MS
    );
    const waiting = clients.filter(
      (c) =>
        c.pendingDisputes === 0 &&
        c.totalDisputes > 0 &&
        (c.lastDisputeUpdatedAt === null || now - c.lastDisputeUpdatedAt < THIRTY_DAYS_MS)
    );
    const inProgress = clients.filter((c) => c.pendingDisputes > 0);

    return { needsIntake, drafts, readyRound2, waiting, inProgress };
  }, [clients, draftIdSet, now]);

  const filteredClients = useMemo(() => {
    switch (activeTab) {
      case 'needs-intake':
        return tiers.needsIntake;
      case 'drafts':
        return tiers.drafts;
      case 'ready-round-2':
        return tiers.readyRound2;
      case 'waiting':
        return tiers.waiting;
      case 'in-progress':
        return tiers.inProgress;
      default:
        return clients;
    }
  }, [activeTab, clients, tiers]);

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
            ring={stats.portfolioSuccessRate !== null ? {
              value: stats.portfolioSuccessRate,
            } : undefined}
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
              <Button
                leftSection={<IconUserPlus size={16} />}
                onClick={openAddModal}
              >
                Add Client
              </Button>
            </Group>

            <Tabs
              value={activeTab}
              onChange={(value) => setActiveTab((value as UrgencyTier) ?? 'all')}
            >
              <Tabs.List>
                <Tabs.Tab value="all" rightSection={<Badge size="sm" variant="filled" circle>{clients.length}</Badge>}>
                  All
                </Tabs.Tab>
                <Tabs.Tab value="needs-intake" rightSection={<Badge size="sm" variant="filled" circle>{tiers.needsIntake.length}</Badge>}>
                  Needs Intake
                </Tabs.Tab>
                <Tabs.Tab value="drafts" rightSection={<Badge size="sm" variant="filled" circle>{tiers.drafts.length}</Badge>}>
                  Drafts
                </Tabs.Tab>
                <Tabs.Tab value="ready-round-2" rightSection={<Badge size="sm" variant="filled" circle>{tiers.readyRound2.length}</Badge>}>
                  Ready for Round 2
                </Tabs.Tab>
                <Tabs.Tab value="waiting" rightSection={<Badge size="sm" variant="filled" circle>{tiers.waiting.length}</Badge>}>
                  Waiting
                </Tabs.Tab>
                <Tabs.Tab value="in-progress" rightSection={<Badge size="sm" variant="filled" circle>{tiers.inProgress.length}</Badge>}>
                  In Progress
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value={activeTab} pt="md">
                <ClientsTable clients={filteredClients} />
              </Tabs.Panel>
            </Tabs>
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

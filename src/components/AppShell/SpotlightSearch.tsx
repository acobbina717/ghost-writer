'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Spotlight,
  type SpotlightActionData,
  type SpotlightActionGroupData,
  spotlight,
} from '@mantine/spotlight';
import {
  IconSearch,
  IconUserPlus,
  IconDashboard,
  IconUsers,
  IconFileText,
  IconUser,
} from '@tabler/icons-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Text, Group, ActionIcon, UnstyledButton, rem, Kbd } from '@mantine/core';
import { Id } from '../../../convex/_generated/dataModel';

interface SpotlightSearchProps {
  userRole: 'admin' | 'team' | 'pending';
}

/**
 * SpotlightSearch - Handles global navigation and client search.
 * Provides a "visible" search experience for non-technical users.
 */
export function SpotlightSearch({ userRole }: SpotlightSearchProps) {
  const router = useRouter();
  const rawClients = useQuery(api.clients.getClientsWithDisputes);
  const clients = useMemo(() => rawClients ?? [], [rawClients]);

  // 1. Navigation Actions
  const navActions: SpotlightActionData[] = useMemo(() => {
    const actions: SpotlightActionData[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        description: 'View your team overview and to-do list',
        onClick: () => router.push('/dashboard'),
        leftSection: <IconDashboard size={20} stroke={1.5} />,
      },
      {
        id: 'clients',
        label: 'Client List',
        description: 'Manage all your credit repair clients',
        onClick: () => router.push('/clients'),
        leftSection: <IconUsers size={20} stroke={1.5} />,
      },
    ];

    if (userRole === 'admin') {
      actions.push(
        {
          id: 'admin-letters',
          label: 'Letter Library',
          description: 'Create and edit dispute letter templates',
          onClick: () => router.push('/admin/letters'),
          leftSection: <IconFileText size={20} stroke={1.5} />,
        },
        {
          id: 'admin-users',
          label: 'Team Management',
          description: 'Verify new signups and manage team roles',
          onClick: () => router.push('/admin/users'),
          leftSection: <IconUsers size={20} stroke={1.5} />,
        }
      );
    }

    return actions;
  }, [router, userRole]);

  // 2. Data Results (Clients) — two sub-actions per client
  const clientActions: SpotlightActionData[] = useMemo(() => {
    return clients.flatMap((client) => {
      const fullName = `${client.firstName} ${client.lastName}`;
      const disputeInfo = `${client.pendingDisputes} pending disputes · ${client.totalDisputes} total`;

      return [
        {
          id: `client-profile-${client._id}`,
          label: `${fullName} — Go to Profile`,
          description: disputeInfo,
          onClick: () => router.push(`/clients/${client._id}`),
          leftSection: <IconUser size={20} stroke={1.5} />,
        },
        {
          id: `client-letter-${client._id}`,
          label: `${fullName} — Start Letter`,
          description: 'Generate a new dispute letter for this client',
          onClick: () => router.push(`/clients/${client._id}?generate=true`),
          leftSection: <IconFileText size={20} stroke={1.5} />,
        },
      ];
    });
  }, [clients, router]);

  // 3. Command Actions
  const commandActions: SpotlightActionData[] = useMemo(() => [
    {
      id: 'add-client',
      label: 'Add New Client',
      description: 'Start the intake process for a new client',
      onClick: () => {
        // This is a bit tricky since the modal is on the dashboard/client page.
        // For now, we'll navigate to dashboard where the "Add Client" button is prominent.
        router.push('/dashboard');
      },
      leftSection: <IconUserPlus size={20} stroke={1.5} />,
    }
  ], [router]);

  // Organize all actions into labeled groups
  const actions: (SpotlightActionData | SpotlightActionGroupData)[] = useMemo(() => {
    const groups: (SpotlightActionData | SpotlightActionGroupData)[] = [
      { group: 'Pages', actions: navActions },
    ];

    if (clientActions.length > 0) {
      groups.push({ group: 'Clients', actions: clientActions });
    }

    groups.push({ group: 'Commands', actions: commandActions });

    return groups;
  }, [navActions, clientActions, commandActions]);

  return (
    <Spotlight
      actions={actions}
      nothingFound="Nothing found..."
      highlightQuery
      searchProps={{
        leftSection: <IconSearch size={20} stroke={1.5} />,
        placeholder: 'Search clients, pages, or actions...',
      }}
      limit={10}
      shortcut={['mod + K', '/']}
      styles={{
        content: { borderRadius: rem(8) },
        action: { borderRadius: rem(4) },
      }}
    />
  );
}

/**
 * SearchTrigger - The visible search bar in the header.
 */
export function SearchTrigger() {
  const isMac = typeof navigator !== 'undefined' && (
    (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform === 'macOS' ||
    /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  );

  return (
    <>
      {/* Desktop Search Bar */}
      <UnstyledButton
        onClick={() => spotlight.open()}
        visibleFrom="sm"
        style={{
          backgroundColor: 'var(--bg-inset)',
          border: '1px solid var(--border-default)',
          borderRadius: rem(6),
          padding: `${rem(6)} ${rem(12)}`,
          width: rem(320),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'border-color 100ms ease',
        }}
        className="search-trigger-hover"
      >
        <Group gap="xs">
          <IconSearch size={16} color="var(--text-tertiary)" stroke={1.5} />
          <Text size="sm" c="dimmed">Search clients or actions...</Text>
        </Group>
        <Kbd style={{ fontSize: rem(11), color: 'var(--text-muted)', fontWeight: 500 }}>
          {isMac ? '⌘ K' : 'Ctrl K'}
        </Kbd>
      </UnstyledButton>

      {/* Mobile Search Icon */}
      <ActionIcon
        variant="subtle"
        size="lg"
        hiddenFrom="sm"
        onClick={() => spotlight.open()}
        color="gray"
      >
        <IconSearch size={20} stroke={1.5} />
      </ActionIcon>
    </>
  );
}

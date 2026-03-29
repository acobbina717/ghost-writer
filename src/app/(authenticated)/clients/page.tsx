'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Center, Loader, Stack, Title, Text, Group, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUserPlus, IconUsers } from '@tabler/icons-react';
import { ClientsTable } from '../dashboard/ClientsTable';
import { ClientFormModal } from '../dashboard/ClientFormModal';
import { EmptyState } from '@/components/EmptyState';

export default function ClientsPage() {
  const clientsWithDisputes = useQuery(api.clients.getClientsWithDisputes);
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);

  if (clientsWithDisputes === undefined) {
    return (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2}>Clients</Title>
          <Text c="dimmed" size="sm" mt="xs">
            {clientsWithDisputes.length} total client{clientsWithDisputes.length !== 1 ? 's' : ''}
          </Text>
        </div>
        <Button leftSection={<IconUserPlus size={16} />} onClick={openAddModal}>
          Add Client
        </Button>
      </Group>

      {clientsWithDisputes.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={48} />}
          title="No clients yet"
          description="Ghost is standing by. Add your first client to get started."
          action={{ label: 'Add Client', onClick: openAddModal }}
        />
      ) : (
        <ClientsTable clients={clientsWithDisputes} />
      )}

      <ClientFormModal opened={addModalOpened} onClose={closeAddModal} mode="create" />
    </Stack>
  );
}

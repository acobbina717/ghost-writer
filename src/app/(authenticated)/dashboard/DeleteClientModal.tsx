'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  Alert,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconTrash } from '@tabler/icons-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

// =============================================================================
// TYPES
// =============================================================================

interface DeleteClientModalProps {
  opened: boolean;
  onClose: () => void;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    daysActive: number;
    totalDisputes: number;
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DeleteClientModal({
  opened,
  onClose,
  client,
}: DeleteClientModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const deleteClient = useMutation(api.clients.deleteClient);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // Start delete mutation before redirecting
      const deletePromise = deleteClient({ clientId: client.id as Id<"clients"> });

      // Redirect immediately to avoid errors from deleted client page
      router.push('/dashboard');

      // Wait for delete to complete and show notification
      await deletePromise;

      notifications.show({
        title: 'Client Deleted',
        message: `${client.firstName} ${client.lastName} has been removed.`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete client',
        color: 'red',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="sm">
            <IconTrash size={14} />
          </ThemeIcon>
          <Text fw={700}>Delete Client</Text>
        </Group>
      }
      size="md"
      closeOnClickOutside={!isDeleting}
      closeOnEscape={!isDeleting}
    >
      <Stack gap="md">
        <Text>
          Are you sure you want to delete{' '}
          <Text span fw={700}>
            {client.firstName} {client.lastName}
          </Text>
          ?
        </Text>

        <Alert
          color="red"
          variant="light"
          icon={<IconAlertTriangle size={18} />}
          title="This action cannot be undone"
        >
          <Stack gap="xs">
            <Text size="sm">Deleting this client will permanently remove:</Text>
            <Text size="sm" component="ul" style={{ margin: 0, paddingLeft: 20 }}>
              <li>All client information and contact details</li>
              {client.totalDisputes > 0 && (
                <li>
                  <Text span fw={500}>{client.totalDisputes}</Text> dispute item
                  {client.totalDisputes !== 1 ? 's' : ''}
                </li>
              )}
              <li>All associated letter generation history</li>
            </Text>
          </Stack>
        </Alert>

        <Text size="sm" c="dimmed">
          This client has been active for {client.daysActive} day
          {client.daysActive !== 1 ? 's' : ''}.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleDelete}
            loading={isDeleting}
            leftSection={<IconTrash size={16} />}
          >
            Delete Client
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

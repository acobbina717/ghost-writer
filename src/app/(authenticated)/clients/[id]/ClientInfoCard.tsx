'use client';

import {
  Card,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  Button,
  SimpleGrid,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconEdit,
  IconTrash,
  IconAlertTriangle,
} from '@tabler/icons-react';
import type { ConvexClient } from '@/lib/convex-types';
import { formatAddress } from '@/lib/formatAddress';
import { ClientFormModal } from '../../dashboard/ClientFormModal';
import { DeleteClientModal } from '../../dashboard/DeleteClientModal';
import { PURGE_ENABLED } from '@/lib/constants';

// =============================================================================
// TYPES
// =============================================================================

interface ClientInfoCardProps {
  client: ConvexClient;
  daysActive: number;
  totalDisputes: number;
}

// =============================================================================
// HELPERS
// =============================================================================

function getAlertLevel(daysActive: number): 'none' | 'warning' | 'danger' {
  if (daysActive >= 85) return 'danger';
  if (daysActive >= 80) return 'warning';
  return 'none';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ClientInfoCard({ client, daysActive, totalDisputes }: ClientInfoCardProps) {
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);

  const alertLevel = getAlertLevel(daysActive);
  const daysRemaining = 91 - daysActive;

  return (
    <>
      <Card withBorder padding="lg">
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="sm" align="center">
                <Title order={2}>
                  {client.firstName} {client.lastName}
                </Title>
                {PURGE_ENABLED && alertLevel !== 'none' && (
                  <Badge
                    variant="light"
                    color={alertLevel === 'danger' ? 'red' : 'orange'}
                    leftSection={<IconAlertTriangle size={12} />}
                  >
                    {daysRemaining} days left
                  </Badge>
                )}
              </Group>
              <Text c="dimmed" size="sm" mt={4}>
                SSN: XXX-XX-{client.last4SSN} • Active for {daysActive} days
              </Text>
            </div>
            <Group gap="xs">
              <Button
                variant="light"
                size="sm"
                leftSection={<IconEdit size={14} />}
                onClick={openEdit}
              >
                Edit
              </Button>
              <Button
                variant="light"
                color="red"
                size="sm"
                leftSection={<IconTrash size={14} />}
                onClick={openDelete}
              >
                Delete
              </Button>
            </Group>
          </Group>

          <Divider />

          {/* Contact Info */}
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Group gap="sm">
              <ThemeIcon variant="light" size="md" radius="xs">
                <IconMail size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Email
                </Text>
                <Text size="sm">{client.email}</Text>
              </div>
            </Group>

            <Group gap="sm">
              <ThemeIcon variant="light" size="md" radius="xs">
                <IconPhone size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Phone
                </Text>
                <Text size="sm">{client.phone}</Text>
              </div>
            </Group>

            <Group gap="sm">
              <ThemeIcon variant="light" size="md" radius="xs">
                <IconMapPin size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Address
                </Text>
                <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                  {formatAddress(client)}
                </Text>
              </div>
            </Group>
          </SimpleGrid>
        </Stack>
      </Card>

      {/* Edit Modal */}
      <ClientFormModal
        opened={editOpened}
        onClose={closeEdit}
        mode="edit"
        initialData={{
          id: client._id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          address1: client.address1,
          address2: client.address2 ?? null,
          city: client.city,
          state: client.state,
          zipCode: client.zipCode,
          last4SSN: client.last4SSN,
        }}
      />

      {/* Delete Modal */}
      <DeleteClientModal
        opened={deleteOpened}
        onClose={closeDelete}
        client={{
          id: client._id,
          firstName: client.firstName,
          lastName: client.lastName,
          daysActive,
          totalDisputes,
        }}
      />
    </>
  );
}


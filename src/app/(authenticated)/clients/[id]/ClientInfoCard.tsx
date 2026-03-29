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
  IconCalendar,
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

interface DisputeStats {
  total: number;
  removed: number;
  pending: number;
  verified: number;
  removalRate: number | null;
}

interface ClientInfoCardProps {
  client: ConvexClient;
  daysActive: number;
  totalDisputes: number;
  disputeStats?: DisputeStats;
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

export function ClientInfoCard({ client, daysActive, totalDisputes, disputeStats }: ClientInfoCardProps) {
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

          {/* Dispute Progress */}
          {disputeStats && disputeStats.total > 0 && (
            <>
              <Divider />
              <Group gap="lg">
                <Text size="sm">
                  {disputeStats.total} item{disputeStats.total !== 1 ? 's' : ''} total
                  {' · '}{disputeStats.removed} removed
                  {' · '}{disputeStats.pending} pending
                  {disputeStats.verified > 0 && ` · ${disputeStats.verified} verified`}
                </Text>
                {disputeStats.removalRate !== null && (
                  <Badge
                    variant="light"
                    color={disputeStats.removalRate >= 70 ? 'green' : disputeStats.removalRate >= 40 ? 'yellow' : 'gray'}
                    size="sm"
                  >
                    {disputeStats.removalRate}% removal rate
                  </Badge>
                )}
              </Group>
            </>
          )}

          <Divider />

          {/* Contact Info */}
          <SimpleGrid cols={{ base: 1, xs: 2, sm: 4 }}>
            <Group gap="sm">
              <ThemeIcon variant="light" size="md" radius="sm">
                <IconCalendar size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Date of Birth
                </Text>
                <Text size="sm">{client.dateOfBirth ?? '—'}</Text>
              </div>
            </Group>

            <Group gap="sm">
              <ThemeIcon variant="light" size="md" radius="sm">
                <IconMail size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Email
                </Text>
                <Text size="sm">{client.email}</Text>
              </div>
            </Group>

            <Group gap="sm">
              <ThemeIcon variant="light" size="md" radius="sm">
                <IconPhone size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
                  Phone
                </Text>
                <Text size="sm">{client.phone}</Text>
              </div>
            </Group>

            <Group gap="sm">
              <ThemeIcon variant="light" size="md" radius="sm">
                <IconMapPin size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dimmed">
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
          dateOfBirth: client.dateOfBirth ?? null,
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


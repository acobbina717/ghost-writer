'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Stack, Group, Title, Text, Button, Center, Loader } from '@mantine/core';
import { IconPlus, IconFileAlert } from '@tabler/icons-react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ClientInfoCard } from './ClientInfoCard';
import { ClientDisputesTable } from './ClientDisputesTable';
import { DisputeGenerateModal, type PrePopulatedData } from './DisputeGenerateModal';
import { EmptyState } from '@/components/EmptyState';
import { PageBreadcrumbs } from '@/components/PageBreadcrumbs/PageBreadcrumbs';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as Id<"clients">;

  const [generateModalOpened, setGenerateModalOpened] = useState(false);
  const [prePopulatedData, setPrePopulatedData] = useState<PrePopulatedData | null>(null);

  // User auth is handled by layout - no need to query/check here
  const client = useQuery(api.clients.getClient, { clientId: id });
  const disputeItems = useQuery(api.clients.getDisputeItemsByClient, { clientId: id });

  // Redirect if client doesn't exist
  useEffect(() => {
    if (client === null) {
      router.push('/dashboard');
    }
  }, [client, router]);

  const handleOpenGenerateModal = (data?: PrePopulatedData) => {
    setPrePopulatedData(data ?? null);
    setGenerateModalOpened(true);
  };

  const handleCloseGenerateModal = () => {
    setGenerateModalOpened(false);
    setPrePopulatedData(null);
  };

  // Loading state or redirecting
  if (client === undefined || client === null || disputeItems === undefined) {
    return (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    );
  }

  const today = new Date();
  // Calculate days active
  const daysActive = Math.floor(
    (today.getTime() - client.createdAt) / (1000 * 60 * 60 * 24)
  );

  // Compute dispute stats for intelligence layer (I2)
  const disputeStats = (() => {
    const total = disputeItems.length;
    const removed = disputeItems.filter(d => d.status === 'removed').length;
    const pending = disputeItems.filter(d => d.status === 'pending').length;
    const verified = disputeItems.filter(d => d.status === 'verified').length;
    const resolved = removed + verified;
    const removalRate = resolved > 0 ? Math.round((removed / resolved) * 100) : null;
    return { total, removed, pending, verified, removalRate };
  })();

  return (
    <Stack gap="xl">
      <PageBreadcrumbs items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: `${client.firstName} ${client.lastName}` },
      ]} />

      {/* Client Info Card */}
      <ClientInfoCard
        client={client}
        daysActive={daysActive}
        totalDisputes={disputeItems.length}
        disputeStats={disputeStats}
      />

      {/* Dispute Items Section */}
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>Dispute Items</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            variant="light"
            onClick={() => handleOpenGenerateModal()}
          >
            Add Dispute
          </Button>
        </Group>

        {disputeItems.length === 0 ? (
          <EmptyState
            icon={<IconFileAlert size={48} />}
            title="No Dispute Items"
            description="Ghost is ready to write. Add a dispute to start generating letters."
            action={{
              label: 'Add Dispute',
              onClick: () => handleOpenGenerateModal(),
              icon: <IconPlus size={16} />,
            }}
          />
        ) : (
          <ClientDisputesTable
            items={disputeItems}
            onOpenGenerateModal={handleOpenGenerateModal}
          />
        )}
      </Stack>

      {/* Dispute Generate Modal */}
      <DisputeGenerateModal
        opened={generateModalOpened}
        onClose={handleCloseGenerateModal}
        clientId={id}
        prePopulatedData={prePopulatedData}
      />
    </Stack>
  );
}

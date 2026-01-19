'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Stack, Group, Title, Text, Anchor, Button, Center, Loader } from '@mantine/core';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { ClientInfoCard } from './ClientInfoCard';
import { ClientDisputesTable } from './ClientDisputesTable';
import { DisputeItemModal } from './DisputeItemModal';
import { LetterSelectionModal } from './LetterSelectionModal';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as Id<"clients">;

  const [disputeModalOpened, setDisputeModalOpened] = useState(false);
  const [letterModalOpened, setLetterModalOpened] = useState(false);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  // User auth is handled by layout - no need to query/check here
  const client = useQuery(api.clients.getClient, { clientId: id });
  const disputeItems = useQuery(api.clients.getDisputeItemsByClient, { clientId: id });

  // Redirect if client doesn't exist
  useEffect(() => {
    if (client === null) {
      router.push('/dashboard');
    }
  }, [client, router]);

  const handleGenerateLetter = (disputeId: string) => {
    setSelectedDisputeId(disputeId);
    setLetterModalOpened(true);
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

  return (
    <Stack gap="xl">
      {/* Back Link */}
      <Anchor component={Link} href="/dashboard" size="sm" c="dimmed">
        <Group gap="xs">
          <IconArrowLeft size={16} />
          Back to Dashboard
        </Group>
      </Anchor>

      {/* Client Info Card */}
      <ClientInfoCard
        client={client}
        daysActive={daysActive}
        totalDisputes={disputeItems.length}
      />

      {/* Dispute Items Section */}
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>Dispute Items</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            variant="light"
            onClick={() => setDisputeModalOpened(true)}
          >
            Add Dispute
          </Button>
        </Group>

        {disputeItems.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No dispute items yet. Add your first dispute to start tracking.
          </Text>
        ) : (
          <ClientDisputesTable
            items={disputeItems}
            onGenerateLetter={handleGenerateLetter}
          />
        )}
      </Stack>

      {/* Modals */}
      <DisputeItemModal
        opened={disputeModalOpened}
        onClose={() => setDisputeModalOpened(false)}
        clientId={id}
      />
      <LetterSelectionModal
        opened={letterModalOpened}
        onClose={() => {
          setLetterModalOpened(false);
          setSelectedDisputeId(null);
        }}
        clientId={id}
        disputeId={selectedDisputeId}
      />
    </Stack>
  );
}

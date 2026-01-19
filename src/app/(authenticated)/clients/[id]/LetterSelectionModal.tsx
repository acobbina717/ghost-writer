'use client';

import { Modal, Stack, Paper, Text, Group, Badge, Button, Center, Loader } from '@mantine/core';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { useRouter } from 'next/navigation';
import { IconFileText } from '@tabler/icons-react';
import { getCraInfo } from '@/lib/constants';

interface LetterSelectionModalProps {
  opened: boolean;
  onClose: () => void;
  clientId: Id<"clients">;
  disputeId: string | null;
}

export function LetterSelectionModal({ opened, onClose, clientId, disputeId }: LetterSelectionModalProps) {
  const router = useRouter();
  const letters = useQuery(api.letters.getLetters);

  const handleSelectLetter = (letterId: string) => {
    if (!disputeId) return;
    router.push(`/clients/${clientId}/generate/${disputeId}?letterId=${letterId}`);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Select a Letter Template"
      size="lg"
    >
      {letters === undefined ? (
        <Center p="xl">
          <Loader size="md" />
        </Center>
      ) : letters.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No letter templates available. Ask an admin to create templates first.
        </Text>
      ) : (
        <Stack gap="md">
          {letters.map((letter) => (
            <Paper
              key={letter._id}
              withBorder
              p="md"
              radius="sm"
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelectLetter(letter._id)}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Group gap="sm">
                    <IconFileText size={20} />
                    <Text fw={500} size="sm">
                      {letter.title}
                    </Text>
                  </Group>
                  
                  <Group gap="xs">
                    <Text size="xs" c="dimmed">Applicable CRAs:</Text>
                    {letter.applicableCRAs.length === 0 ? (
                      <Badge size="xs" variant="light" color="gray">
                        All CRAs
                      </Badge>
                    ) : (
                      letter.applicableCRAs.map((cra) => {
                        const craInfo = getCraInfo(cra);
                        return (
                          <Badge key={cra} size="xs" variant="light" color={craInfo.color}>
                            {craInfo.label}
                          </Badge>
                        );
                      })
                    )}
                  </Group>

                  {letter.formSchema && Array.isArray(letter.formSchema) && letter.formSchema.length > 0 && (
                    <Text size="xs" c="dimmed">
                      {letter.formSchema.length} custom field{letter.formSchema.length !== 1 ? 's' : ''} required
                    </Text>
                  )}
                </Stack>

                <Button size="xs" variant="light">
                  Select
                </Button>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Modal>
  );
}

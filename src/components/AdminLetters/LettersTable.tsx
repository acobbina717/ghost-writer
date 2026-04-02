'use client';

import { Table, Group, Text, Badge, ActionIcon, Tooltip, Card, Progress, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatDate } from '@/lib/utils';
import { FW } from '@/theme/ghost-theme';
import type { ConvexLetter } from '@/lib/convex-types';

interface TemplateStatsMap {
  [letterId: string]: { successRate: number | null; usageCount: number };
}

interface LettersTableProps {
  letters: ConvexLetter[];
  templateStats?: TemplateStatsMap;
}

const CRA_COLORS: Record<string, string> = {
  experian: 'blue',
  equifax: 'red',
  transunion: 'green',
};

function getSuccessColor(rate: number | null): string {
  if (rate === null) return 'gray';
  if (rate >= 70) return 'green';
  if (rate >= 40) return 'yellow';
  return 'red';
}

export function LettersTable({ letters, templateStats }: LettersTableProps) {
  const router = useRouter();
  const deleteLetter = useMutation(api.letters.deleteLetter);

  const handleDelete = async (letterId: string, letterTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${letterTitle}"?`)) {
      return;
    }

    try {
      await deleteLetter({ id: letterId as Id<"letters"> });
      notifications.show({
        title: 'Letter Deleted',
        message: `"${letterTitle}" has been deleted.`,
        color: 'orange',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete letter',
        color: 'red',
      });
    }
  };

  return (
    <Card withBorder padding="md">
      <Table.ScrollContainer minWidth={600}>
        <Table verticalSpacing="xs" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Applicable CRAs</Table.Th>
              <Table.Th>Dispute Types</Table.Th>
              <Table.Th>Performance</Table.Th>
              <Table.Th>Last Updated</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {letters.map((letter) => {
              return (
                <Table.Tr key={letter._id}>
                  <Table.Td>
                    <Text fw={FW.BODY}>{letter.title}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {letter.applicableCRAs.map((cra) => (
                        <Badge
                          key={cra}
                          size="sm"
                          variant="light"
                          color={CRA_COLORS[cra.toLowerCase()] || 'gray'}
                        >
                          {cra}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {letter.disputeTypes?.join(', ') || 'None'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {templateStats?.[letter._id] ? (
                      <Stack gap={4}>
                        <Group gap="xs">
                          <Badge
                            variant="light"
                            color={getSuccessColor(templateStats[letter._id].successRate)}
                            size="sm"
                          >
                            {templateStats[letter._id].successRate !== null
                              ? `${templateStats[letter._id].successRate}%`
                              : '—'}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {templateStats[letter._id].usageCount} use{templateStats[letter._id].usageCount !== 1 ? 's' : ''}
                          </Text>
                        </Group>
                        {templateStats[letter._id].successRate !== null && (
                          <Progress
                            value={templateStats[letter._id].successRate!}
                            size="xs"
                            color={getSuccessColor(templateStats[letter._id].successRate)}
                            style={{ width: 100 }}
                          />
                        )}
                      </Stack>
                    ) : (
                      <Text size="xs" c="dimmed" fs="italic">No data</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {formatDate(new Date(letter.updatedAt))}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Edit Letter">
                        <ActionIcon
                          variant="light"
                          onClick={() => router.push(`/admin/letters/${letter._id}`)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete Letter">
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(letter._id, letter.title)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}

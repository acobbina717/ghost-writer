'use client';

import { Paper, Text, Stack, Group, Box } from '@mantine/core';
import { IconTrendingDown } from '@tabler/icons-react';
import { FW } from '@/theme/ghost-theme';

// =============================================================================
// TYPES
// =============================================================================

interface RoundPerf {
  round: number;
  total: number;
  removed: number;
  resolved: number;
  rate: number | null;
}

interface SuccessFunnelProps {
  roundPerformance: RoundPerf[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ROUND_OPACITY: Record<number, number> = {
  1: 1.0,
  2: 0.7,
  3: 0.4,
};

const MIN_RESOLVED_THRESHOLD = 5;

function getRoundLabel(round: number): string {
  if (round >= 3) return 'Round 3+';
  return `Round ${round}`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SuccessFunnel({ roundPerformance }: SuccessFunnelProps) {
  // Sort rounds in ascending order
  const sorted = [...roundPerformance].sort((a, b) => a.round - b.round);

  // Gate: require at least 5 total resolved items across all rounds
  const totalResolved = sorted.reduce((sum, r) => sum + r.resolved, 0);

  if (totalResolved < MIN_RESOLVED_THRESHOLD) {
    return (
      <Paper withBorder p="lg" radius="sm">
        <Stack gap="xs">
          <Group gap="xs" align="center">
            <IconTrendingDown size={20} style={{ color: 'var(--mantine-color-dimmed)' }} />
            <Text fw={FW.LABEL} size="md">
              Round Performance
            </Text>
          </Group>
          <Text size="sm" c="dimmed" fs="italic">
            Not enough data yet. At least {MIN_RESOLVED_THRESHOLD} resolved items are needed to
            display the success funnel.
          </Text>
        </Stack>
      </Paper>
    );
  }

  // Find max rate for proportional bar widths
  const maxRate = Math.max(
    ...sorted.map((r) => r.rate ?? 0),
    1 // avoid division by zero
  );

  return (
    <Paper withBorder p="lg" radius="sm">
      <Stack gap="md">
        {/* Header */}
        <div>
          <Group gap="xs" align="center" mb={2}>
            <IconTrendingDown size={20} style={{ color: 'var(--mantine-color-action-6)' }} />
            <Text fw={FW.HEADING} size="md">
              Round Performance
            </Text>
          </Group>
          <Text size="xs" c="dimmed" fw={FW.BODY}>
            Success rate by dispute round
          </Text>
        </div>

        {/* Funnel Bars */}
        <Stack gap="sm">
          {sorted.map((row) => {
            const rate = row.rate ?? 0;
            const barWidth = maxRate > 0 ? (rate / maxRate) * 100 : 0;
            const opacity = ROUND_OPACITY[row.round] ?? ROUND_OPACITY[3];

            return (
              <Group key={row.round} gap="sm" wrap="nowrap" align="center">
                {/* Round Label */}
                <Text size="sm" fw={FW.BODY} w={72} style={{ flexShrink: 0 }}>
                  {getRoundLabel(row.round)}
                </Text>

                {/* Bar */}
                <Box style={{ flex: 1, position: 'relative' }}>
                  <Box
                    style={{
                      height: 28,
                      borderRadius: 'var(--mantine-radius-sm)',
                      backgroundColor: 'var(--bg-inset)',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      style={{
                        height: '100%',
                        width: `${Math.max(barWidth, rate > 0 ? 3 : 0)}%`,
                        backgroundColor: 'var(--mantine-color-action-6)',
                        opacity,
                        borderRadius: 'var(--mantine-radius-sm)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </Box>
                </Box>

                {/* Rate + Count */}
                <Group gap={4} wrap="nowrap" style={{ flexShrink: 0, minWidth: 100 }} justify="flex-end">
                  <Text size="sm" fw={FW.HEADING}>
                    {row.rate !== null ? `${row.rate}%` : '--'}
                  </Text>
                  <Text size="xs" c="dimmed" fw={FW.BODY}>
                    ({row.removed}/{row.resolved})
                  </Text>
                </Group>
              </Group>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}

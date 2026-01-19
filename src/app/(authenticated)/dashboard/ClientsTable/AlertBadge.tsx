import { Badge, Tooltip } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { PURGE_LIMIT_DAYS, PURGE_ENABLED } from '@/lib/constants';
import type { AlertLevel } from '@/lib/convex-types';


interface AlertBadgeProps {
  alertLevel: AlertLevel;
  daysActive: number;
}



export function AlertBadge({ alertLevel, daysActive }: AlertBadgeProps) {
  // Don't show badges when purge feature is disabled
  if (!PURGE_ENABLED) return null;
  if (alertLevel === 'none') return null;

  const daysRemaining = PURGE_LIMIT_DAYS - daysActive;
  const color = alertLevel === 'danger' ? 'red' : 'orange';
  const label = alertLevel === 'danger' ? 'URGENT' : 'WARNING';

  return (
    <Tooltip label={`${daysRemaining} days until data purge`} withArrow>
      <Badge
        variant="light"
        color={color}
        size="xs"
        leftSection={<IconAlertTriangle size={10} />}
      >
        {label}
      </Badge>
    </Tooltip>
  );
}

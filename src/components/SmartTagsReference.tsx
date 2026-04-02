'use client';

import { useMemo } from 'react';
import {
  Badge,
  Box,
  Group,
  Stack,
  Text,
  Tooltip,
  Paper,
} from '@mantine/core';
import {
  IconCalendar,
  IconUser,
  IconList,
  IconHash,
  IconCheck,
  IconAlertCircle,
  IconCircle,
} from '@tabler/icons-react';
import { FW } from '@/theme/ghost-theme';

// =============================================================================
// Tag definitions (Synced with SmartTagsSidebar)
// =============================================================================

interface SmartTag {
  tag: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  fieldKey?: string; // Used for scrolling to field
}

const CLIENT_INFO_TAGS: SmartTag[] = [
  { tag: '{{client_name}}', label: 'Full Name', description: 'Client full name', icon: <IconUser size={14} /> },
  { tag: '{{first_name}}', label: 'First Name', description: 'Client first name', icon: <IconUser size={14} />, fieldKey: 'firstName' },
  { tag: '{{last_name}}', label: 'Last Name', description: 'Client last name', icon: <IconUser size={14} />, fieldKey: 'lastName' },
  { tag: '{{client_address}}', label: 'Mailing Address', description: 'Full mailing address', icon: <IconUser size={14} />, fieldKey: 'address1' },
  { tag: '{{client_ssn}}', label: 'SSN (masked)', description: 'SSN as XXX-XX-1234', icon: <IconUser size={14} />, fieldKey: 'last4SSN' },
  { tag: '{{client_dob}}', label: 'Date of Birth', description: 'Client date of birth', icon: <IconUser size={14} />, fieldKey: 'dateOfBirth' },
  { tag: '{{client_email}}', label: 'Email Address', description: 'Client email', icon: <IconUser size={14} />, fieldKey: 'email' },
  { tag: '{{client_phone}}', label: 'Phone Number', description: 'Client phone number', icon: <IconUser size={14} />, fieldKey: 'phone' },
];

const SYSTEM_TAGS: SmartTag[] = [
  { tag: '{{current_date}}', label: "Today's Date", description: 'Auto-generated current date', icon: <IconCalendar size={14} /> },
];

const ITEM_TAGS: SmartTag[] = [
  { tag: '{{item_number}}', label: 'Item #', description: 'Auto-numbers: 1, 2, 3...', icon: <IconHash size={14} /> },
  { tag: '{{item_creditor_name}}', label: 'Creditor', description: 'Creditor/Furnisher Name', icon: <IconList size={14} />, fieldKey: 'creditorName' },
  { tag: '{{item_account_number}}', label: 'Account #', description: 'Partial/Full Account Number', icon: <IconList size={14} />, fieldKey: 'accountNumber' },
  { tag: '{{item_balance}}', label: 'Balance', description: 'Account Balance', icon: <IconList size={14} />, fieldKey: 'balance' },
  { tag: '{{item_inquiry_date}}', label: 'Inquiry Date', description: 'Date of Inquiry', icon: <IconList size={14} />, fieldKey: 'inquiryDate' },
  { tag: '{{item_date_opened}}', label: 'Date Opened', description: 'Account Open Date', icon: <IconList size={14} />, fieldKey: 'dateOpened' },
  { tag: '{{item_months_late}}', label: 'Months Late', description: 'Total months delinquent', icon: <IconList size={14} />, fieldKey: 'monthsLate' },
  { tag: '{{item_month_late}}', label: 'Month Late', description: 'Specific month/year late', icon: <IconList size={14} />, fieldKey: 'monthLate' },
];

// =============================================================================
// Component
// =============================================================================

export type TagStatus = 'success' | 'warning' | 'unused';
export type DisplayMode = 'full' | 'iconOnly';

interface SmartTagsReferenceProps {
  /** The raw letter content to check for tag usage */
  letterContent?: string;
  /** Tags currently unresolved in the hydrated preview */
  unresolvedTags: string[];
  /** Optional: Callback when a tag with a fieldKey is clicked */
  onTagClick?: (fieldKey: string) => void;
  /** Whether we are currently focused on a dispute item */
  isItemFocused?: boolean;
  /** Display mode: 'full' (default sidebar), 'iconOnly' (collapsed icons) */
  displayMode?: DisplayMode;
}

export function SmartTagsReference({
  letterContent = '',
  unresolvedTags,
  onTagClick,
  isItemFocused = false,
  displayMode = 'full',
}: SmartTagsReferenceProps) {
  
  const usedTags = useMemo(() => {
    const found = new Set<string>();
    const matches = letterContent.match(/\{\{[^{}]+\}\}/g);
    if (matches) {
      matches.forEach(m => found.add(m));
    }
    return found;
  }, [letterContent]);

  const getTagStatus = (tag: string): TagStatus => {
    if (!usedTags.has(tag)) return 'unused';
    const cleanTag = tag.replace(/[{}]/g, '');
    if (unresolvedTags.includes(cleanTag)) return 'warning';
    return 'success';
  };

  const renderStatusIcon = (status: TagStatus) => {
    if (status === 'success') return <IconCheck size={12} color="var(--mantine-color-green-6)" />;
    if (status === 'warning') return <IconAlertCircle size={12} color="var(--mantine-color-yellow-6)" />;
    return <IconCircle size={8} color="var(--mantine-color-gray-4)" fill="currentColor" />;
  };

  const renderTag = (st: SmartTag) => {
    const status = getTagStatus(st.tag);
    const isClickable = !!st.fieldKey && status !== 'unused';

    if (displayMode === 'iconOnly') {
      return (
        <Tooltip key={st.tag} label={`${st.label} — ${st.tag} (${status})`} position="right" withArrow>
          <Paper
            withBorder
            p={4}
            radius="xs"
            bg={status === 'unused' ? 'transparent' : 'var(--bg-surface)'}
            style={{
              borderColor: status === 'warning' ? 'var(--mantine-color-yellow-3)' : undefined,
              cursor: isClickable ? 'pointer' : 'default',
              opacity: status === 'unused' ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 32,
              width: 32,
            }}
            onClick={() => isClickable && onTagClick?.(st.fieldKey!)}
          >
            {st.icon}
          </Paper>
        </Tooltip>
      );
    }

    return (
      <Tooltip key={st.tag} label={st.description} position="right" withArrow>
        <Paper
          withBorder
          p={6}
          radius="xs"
          bg={status === 'unused' ? 'transparent' : 'var(--bg-surface)'}
          style={{
            borderColor: status === 'warning' ? 'var(--mantine-color-yellow-3)' : undefined,
            cursor: isClickable ? 'pointer' : 'default',
            opacity: status === 'unused' ? 0.6 : 1,
          }}
          onClick={() => isClickable && onTagClick?.(st.fieldKey!)}
        >
          <Group gap="xs" wrap="nowrap">
            {renderStatusIcon(status)}
            <Box style={{ flex: 1, overflow: 'hidden' }}>
              <Text size="xs" fw={status !== 'unused' ? FW.HEADING : FW.BODY} truncate>
                {st.label}
              </Text>
              {status !== 'unused' && (
                <Text size="xxs" c="dimmed" truncate fw={FW.BODY}>
                  {st.tag}
                </Text>
              )}
            </Box>
          </Group>
        </Paper>
      </Tooltip>
    );
  };

  const tagsToShow = isItemFocused ? ITEM_TAGS : [...CLIENT_INFO_TAGS, ...SYSTEM_TAGS];

  return (
    <Stack gap="md" align={displayMode === 'iconOnly' ? 'center' : 'stretch'}>
      <Box w="100%">
        {displayMode === 'full' && (
          <Text size="xs" fw={FW.LABEL} tt="uppercase" c="dimmed" mb={4} style={{ letterSpacing: 'var(--ls-wide)' }}>
            Context Tags
          </Text>
        )}
        <Tooltip label={isItemFocused ? 'Editing Dispute Item' : 'Letter Scope'} position="right" disabled={displayMode === 'full'}>
          <Badge
            variant="light"
            color={isItemFocused ? 'violet' : 'blue'}
            size="xs"
            fullWidth
            styles={{ root: { textTransform: 'none', fontWeight: FW.LABEL, height: displayMode === 'iconOnly' ? 32 : undefined } }}
          >
            {displayMode === 'iconOnly' ? (isItemFocused ? 'D' : 'L') : (isItemFocused ? 'Editing Dispute Item' : 'Letter Scope')}
          </Badge>
        </Tooltip>
      </Box>

      <Stack gap={4} align={displayMode === 'iconOnly' ? 'center' : 'stretch'} w="100%">
        {displayMode === 'full' && (
          <Text size="xxs" fw={FW.LABEL} c="dimmed" tt="uppercase" style={{ letterSpacing: 'var(--ls-wide)' }}>
            {isItemFocused ? 'Item Fields' : 'Info'}
          </Text>
        )}
        {tagsToShow.map(renderTag)}
      </Stack>

      {displayMode === 'full' && isItemFocused && (
        <Text size="xxs" c="dimmed" ta="center" fs="italic">
          Uncheck &quot;Customize per CRA&quot; to <br /> edit shared info
        </Text>
      )}
    </Stack>
  );
}

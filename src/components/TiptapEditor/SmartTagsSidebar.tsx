'use client';

import { useMemo } from 'react';
import { Stack, Text, Button, Paper, Tooltip, Divider } from '@mantine/core';
import {
  IconCalendar,
  IconUser,
  IconList,
  IconHash,
} from '@tabler/icons-react';
import type { Editor } from '@tiptap/react';
import { DISPUTE_ITEM_SCHEMAS, getSchemaGroupForType } from '../../../convex/constants';

// =============================================================================
// Tag definitions
// =============================================================================

interface SmartTag {
  tag: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const CLIENT_INFO_TAGS: SmartTag[] = [
  { tag: '{{client_name}}', label: 'Full Name', description: 'Client full name', icon: <IconUser size={14} /> },
  { tag: '{{first_name}}', label: 'First Name', description: 'Client first name', icon: <IconUser size={14} /> },
  { tag: '{{last_name}}', label: 'Last Name', description: 'Client last name', icon: <IconUser size={14} /> },
  { tag: '{{client_address}}', label: 'Mailing Address', description: 'Full mailing address', icon: <IconUser size={14} /> },
  { tag: '{{client_ssn}}', label: 'SSN (masked)', description: 'SSN as XXX-XX-1234', icon: <IconUser size={14} /> },
  { tag: '{{client_dob}}', label: 'Date of Birth', description: 'Client date of birth', icon: <IconUser size={14} /> },
  { tag: '{{client_email}}', label: 'Email Address', description: 'Client email', icon: <IconUser size={14} /> },
  { tag: '{{client_phone}}', label: 'Phone Number', description: 'Client phone number', icon: <IconUser size={14} /> },
];

const SYSTEM_TAGS: SmartTag[] = [
  { tag: '{{current_date}}', label: "Today's Date", description: 'Auto-generated current date', icon: <IconCalendar size={14} /> },
];

// Per-item tag key → tag name mapping
const ITEM_TAG_MAP: Record<string, string> = {
  creditorName: 'item_creditor_name',
  accountNumber: 'item_account_number',
  inquiryDate: 'item_inquiry_date',
  dateOpened: 'item_date_opened',
  balance: 'item_balance',
  monthsLate: 'item_months_late',
  monthLate: 'item_month_late',
};

// =============================================================================
// Component
// =============================================================================

interface SmartTagsSidebarProps {
  editor: Editor | null;
  /** The currently selected dispute types on the letter — drives per-item tags */
  disputeTypes?: string[];
}

export function SmartTagsSidebar({ editor, disputeTypes = [] }: SmartTagsSidebarProps) {
  const insertTag = (tag: string) => {
    if (!editor) return;
    if (!editor.state.selection.empty) {
      editor.chain().focus().deleteSelection().insertContent(tag).run();
    } else {
      editor.chain().focus().insertContent(tag).run();
    }
  };

  // Check if cursor is inside the dispute block
  const isInsideDisputeBlock = useMemo(() => {
    if (!editor) return false;
    const { $from } = editor.state.selection;
    for (let depth = $from.depth; depth > 0; depth--) {
      if ($from.node(depth).type.name === 'disputeItemsBlock') {
        return true;
      }
    }
    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, editor?.state.selection]);

  // Check if document already has a dispute block
  const hasDisputeBlock = useMemo(() => {
    if (!editor) return false;
    let found = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'disputeItemsBlock') found = true;
    });
    return found;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, editor?.state.doc]);

  // Get per-item tags based on the letter's dispute types schema group
  const perItemTags = useMemo((): SmartTag[] => {
    if (disputeTypes.length === 0) return [];
    const schema = getSchemaGroupForType(disputeTypes[0]);
    if (!schema) return [];

    // Always include item_number
    const tags: SmartTag[] = [
      { tag: '{{item_number}}', label: 'Item #', description: 'Auto-numbers: 1, 2, 3...', icon: <IconHash size={14} /> },
    ];

    for (const field of schema.fields) {
      const tagName = ITEM_TAG_MAP[field.key];
      if (tagName) {
        tags.push({
          tag: `{{${tagName}}}`,
          label: field.label,
          description: `Per-item: ${field.label}`,
          icon: <IconList size={14} />,
        });
      }
    }

    return tags;
  }, [disputeTypes]);

  const renderTagGroup = (title: string, tags: SmartTag[]) => (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" fw={500} tt="uppercase" mb={4}>
        {title}
      </Text>
      {tags.map((tag) => (
        <Tooltip
          key={tag.tag}
          label={tag.description}
          position="left"
          withArrow
        >
          <Button
            variant="subtle"
            size="xs"
            justify="flex-start"
            leftSection={tag.icon}
            onClick={() => insertTag(tag.tag)}
            styles={{
              root: { height: 'auto', padding: '6px 8px' },
              inner: { justifyContent: 'flex-start' },
              label: { fontWeight: 400 },
            }}
          >
            {tag.label}
          </Button>
        </Tooltip>
      ))}
    </Stack>
  );

  return (
    <Paper withBorder p="sm" style={{ minWidth: 200 }}>
      <Stack gap="md">
        <div>
          <Text size="sm" fw={600} mb={4}>
            Smart Tags
          </Text>
          <Text size="xs" c="dimmed">
            Click to insert at cursor
          </Text>
        </div>

        <Divider />

        {/* Per-item tags shown when cursor is inside the dispute block */}
        {isInsideDisputeBlock && perItemTags.length > 0 && (
          <>
            {renderTagGroup('Dispute Item Fields', perItemTags)}
            <Divider />
          </>
        )}

        {renderTagGroup('Client Info', CLIENT_INFO_TAGS)}

        <Divider />

        {renderTagGroup('System', SYSTEM_TAGS)}

        <Divider />

        {/* Insert Dispute Items Section button */}
        <Stack gap={4}>
          <Text size="xs" c="dimmed" fw={500} tt="uppercase" mb={4}>
            Dispute Items
          </Text>
          <Tooltip
            label={hasDisputeBlock ? 'Already added' : 'Insert a repeating section for dispute items'}
            position="left"
            withArrow
          >
            <Button
              variant="light"
              color="violet"
              size="xs"
              justify="flex-start"
              leftSection={<IconList size={14} />}
              onClick={() => editor?.commands.insertDisputeBlock()}
              disabled={hasDisputeBlock}
              styles={{
                root: { height: 'auto', padding: '6px 8px' },
                inner: { justifyContent: 'flex-start' },
                label: { fontWeight: 400 },
              }}
            >
              Insert Dispute Items Section
            </Button>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

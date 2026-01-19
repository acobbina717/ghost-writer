'use client';

import { Stack, Text, Button, Paper, Tooltip, Divider, Badge } from '@mantine/core';
import {
  IconUser,
  IconMapPin,
  IconId,
  IconAlertCircle,
  IconBuilding,
  IconCalendar,
  IconTag,
} from '@tabler/icons-react';
import type { Editor } from '@tiptap/react';

interface SmartTag {
  tag: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'client' | 'dispute' | 'system' | 'custom';
}

const GLOBAL_SMART_TAGS: SmartTag[] = [
  // Client data tags
  {
    tag: '{{client_name}}',
    label: 'Client Name',
    description: 'Full name (First + Last)',
    icon: <IconUser size={14} />,
    category: 'client',
  },
  {
    tag: '{{client_address}}',
    label: 'Client Address',
    description: 'Full mailing address',
    icon: <IconMapPin size={14} />,
    category: 'client',
  },
  {
    tag: '{{last_4_ssn}}',
    label: 'Last 4 SSN',
    description: 'Masked as XXX-XX-1234',
    icon: <IconId size={14} />,
    category: 'client',
  },

  // Dispute data tags
  {
    tag: '{{dispute_type}}',
    label: 'Dispute Type',
    description: 'Type of dispute (Medical, Collection, etc.)',
    icon: <IconAlertCircle size={14} />,
    category: 'dispute',
  },
  {
    tag: '{{creditor_name}}',
    label: 'Creditor Name',
    description: 'Name of creditor/collector',
    icon: <IconBuilding size={14} />,
    category: 'dispute',
  },
  {
    tag: '{{account_number}}',
    label: 'Account Number',
    description: 'Account or reference number',
    icon: <IconTag size={14} />,
    category: 'dispute',
  },

  // System tags
  {
    tag: '{{current_date}}',
    label: 'Current Date',
    description: "Today's date (auto-generated)",
    icon: <IconCalendar size={14} />,
    category: 'system',
  },
];

interface SmartTagsSidebarProps {
  editor: Editor | null;
  customTags?: Array<{ tagId: string; label: string }>;
}

export function SmartTagsSidebar({ editor, customTags = [] }: SmartTagsSidebarProps) {
  const insertTag = (tag: string) => {
    if (!editor) return;

    // If there's a selection, replace it with the tag
    if (!editor.state.selection.empty) {
      editor.chain().focus().deleteSelection().insertContent(tag).run();
    } else {
      // Otherwise, insert at cursor position
      editor.chain().focus().insertContent(tag).run();
    }
  };

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
              root: {
                height: 'auto',
                padding: '6px 8px',
              },
              inner: {
                justifyContent: 'flex-start',
              },
              label: {
                fontWeight: 400,
              },
            }}
          >
            {tag.label}
          </Button>
        </Tooltip>
      ))}
    </Stack>
  );

  const clientTags = GLOBAL_SMART_TAGS.filter((t) => t.category === 'client');
  const disputeTags = GLOBAL_SMART_TAGS.filter((t) => t.category === 'dispute');
  const systemTags = GLOBAL_SMART_TAGS.filter((t) => t.category === 'system');

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

        {renderTagGroup('Client Data', clientTags)}
        {renderTagGroup('Dispute Data', disputeTags)}
        {renderTagGroup('System', systemTags)}

        {customTags.length > 0 && (
          <>
            <Divider />
            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={500} tt="uppercase" mb={4}>
                Custom Fields
              </Text>
              {customTags.map((tag) => (
                <Tooltip
                  key={tag.tagId}
                  label={`Custom field: ${tag.label}`}
                  position="left"
                  withArrow
                >
                  <Button
                    variant="subtle"
                    size="xs"
                    color="violet"
                    justify="flex-start"
                    leftSection={<IconTag size={14} />}
                    onClick={() => insertTag(`{{${tag.tagId}}}`)}
                    styles={{
                      root: {
                        height: 'auto',
                        padding: '6px 8px',
                      },
                      inner: {
                        justifyContent: 'flex-start',
                      },
                      label: {
                        fontWeight: 400,
                      },
                    }}
                  >
                    {tag.label}
                  </Button>
                </Tooltip>
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}


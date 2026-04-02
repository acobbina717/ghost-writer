'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Group,
  Stack,
  Text,
  Button,
  Paper,
  Tooltip,
  Divider,
  Transition,
} from '@mantine/core';
import {
  IconCalendar,
  IconUser,
  IconList,
  IconHash,
  IconRepeat,
} from '@tabler/icons-react';
import type { Editor } from '@tiptap/react';
import { getSchemaGroupForType } from '../../../convex/constants';
import { FW, LAYOUT } from '@/theme/ghost-theme';

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

// Per-item tag key -> tag name mapping
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
// Cursor-context hook — listens to Tiptap selection changes
// =============================================================================

interface CursorContext {
  isInsideDisputeBlock: boolean;
  hasDisputeBlock: boolean;
}

function useCursorContext(editor: Editor | null): CursorContext {
  const [ctx, setCtx] = useState<CursorContext>({
    isInsideDisputeBlock: false,
    hasDisputeBlock: false,
  });

  const compute = useCallback(() => {
    if (!editor) return;

    // Check if cursor is inside a disputeItemsBlock node
    const { $from } = editor.state.selection;
    let inside = false;
    for (let depth = $from.depth; depth > 0; depth--) {
      if ($from.node(depth).type.name === 'disputeItemsBlock') {
        inside = true;
        break;
      }
    }

    // Check if any disputeItemsBlock exists in the document
    let found = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'disputeItemsBlock') found = true;
    });

    setCtx((prev) => {
      if (prev.isInsideDisputeBlock === inside && prev.hasDisputeBlock === found) {
        return prev; // avoid unnecessary re-renders
      }
      return { isInsideDisputeBlock: inside, hasDisputeBlock: found };
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    // Compute immediately on mount / editor change
    setTimeout(() => {
      compute();
    }, 0);

    // Listen to both selection and content changes
    editor.on('selectionUpdate', compute);
    editor.on('update', compute);

    return () => {
      editor.off('selectionUpdate', compute);
      editor.off('update', compute);
    };
  }, [editor, compute]);

  return ctx;
}

// =============================================================================
// Component
// =============================================================================

type DisplayMode = 'full' | 'iconOnly' | 'horizontal';

interface SmartTagsSidebarProps {
  editor: Editor | null;
  /** The currently selected dispute types on the letter — drives per-item tags */
  disputeTypes?: string[];
  /** Display mode: 'full' (default sidebar), 'iconOnly' (collapsed icons), 'horizontal' (toolbar strip) */
  displayMode?: DisplayMode;
}

export function SmartTagsSidebar({ editor, disputeTypes = [], displayMode = 'full' }: SmartTagsSidebarProps) {
  const { isInsideDisputeBlock, hasDisputeBlock } = useCursorContext(editor);

  const insertTag = useCallback(
    (tag: string) => {
      if (!editor) return;
      if (!editor.state.selection.empty) {
        editor.chain().focus().deleteSelection().insertContent(tag).run();
      } else {
        editor.chain().focus().insertContent(tag).run();
      }
    },
    [editor],
  );

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

  const renderTagGroup = (title: string, tags: SmartTag[]) => {
    if (displayMode === 'horizontal') {
      return (
        <Group gap={4} wrap="wrap">
          {tags.map((tag) => (
            <Tooltip key={tag.tag} label={tag.description} withArrow>
              <Button
                variant="subtle"
                size="compact-xs"
                leftSection={tag.icon}
                onClick={() => insertTag(tag.tag)}
                styles={{ label: { fontWeight: 400 } }}
              >
                {tag.label}
              </Button>
            </Tooltip>
          ))}
        </Group>
      );
    }

    if (displayMode === 'iconOnly') {
      return (
        <Stack gap={2}>
          {tags.map((tag) => (
            <Tooltip key={tag.tag} label={`${tag.label} — ${tag.description}`} position="right" withArrow>
              <Button
                variant="subtle"
                size="compact-sm"
                onClick={() => insertTag(tag.tag)}
                styles={{
                  root: { width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
                  inner: { justifyContent: 'center' },
                  label: { display: 'none' },
                  section: { margin: 0 },
                }}
                leftSection={tag.icon}
              >
                {null}
              </Button>
            </Tooltip>
          ))}
        </Stack>
      );
    }

    return (
      <Stack gap={4}>
        <Text size="xs" c="dimmed" fw={FW.LABEL} tt="uppercase" mb={4} style={{ letterSpacing: 'var(--ls-wide)' }}>
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
                root: { height: 'auto', padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)' },
                inner: { justifyContent: 'flex-start' },
                label: { fontWeight: FW.BODY },
              }}
            >
              {tag.label}
            </Button>
          </Tooltip>
        ))}
      </Stack>
    );
  };

  // ----- Horizontal mode (below-toolbar strip) -----
  if (displayMode === 'horizontal') {
    const allTags = isInsideDisputeBlock
      ? perItemTags
      : [...CLIENT_INFO_TAGS, ...SYSTEM_TAGS];

    return (
      <Box py={6} px="sm">
        <Group gap="xs" wrap="wrap" align="center">
          <Badge
            variant="light"
            color={isInsideDisputeBlock ? 'violet' : 'blue'}
            size="sm"
            leftSection={isInsideDisputeBlock ? <IconRepeat size={12} /> : <IconUser size={12} />}
            styles={{ root: { textTransform: 'none', fontWeight: 500, flexShrink: 0 } }}
          >
            {isInsideDisputeBlock ? 'Dispute' : 'Doc'}
          </Badge>
          <Divider orientation="vertical" />
          {renderTagGroup('', allTags)}
          <Divider orientation="vertical" />
          <Tooltip
            label={hasDisputeBlock ? 'Already added' : 'Insert dispute items section'}
            withArrow
          >
            <Button
              variant="light"
              color="violet"
              size="compact-xs"
              leftSection={<IconList size={14} />}
              onClick={() => editor?.commands.insertDisputeBlock()}
              disabled={hasDisputeBlock}
            >
              Dispute Block
            </Button>
          </Tooltip>
        </Group>
      </Box>
    );
  }

  // ----- Icon-only mode (collapsed gutter) -----
  if (displayMode === 'iconOnly') {
    const allTags = isInsideDisputeBlock
      ? perItemTags
      : [...CLIENT_INFO_TAGS, ...SYSTEM_TAGS];

    return (
      <Stack gap={4} align="center" py="xs">
        <Tooltip label={isInsideDisputeBlock ? 'Dispute block scope' : 'Document scope'} position="right" withArrow>
          <Badge
            variant="light"
            color={isInsideDisputeBlock ? 'violet' : 'blue'}
            size="xs"
            w={36}
            styles={{ root: { textTransform: 'none', fontWeight: 500, padding: 0, display: 'flex', justifyContent: 'center' } }}
          >
            {isInsideDisputeBlock ? <IconRepeat size={12} /> : <IconUser size={12} />}
          </Badge>
        </Tooltip>
        <Divider w="100%" />
        {renderTagGroup('', allTags)}
        <Divider w="100%" />
        <Tooltip label={hasDisputeBlock ? 'Already added' : 'Insert dispute items section'} position="right" withArrow>
          <Button
            variant="light"
            color="violet"
            size="compact-sm"
            onClick={() => editor?.commands.insertDisputeBlock()}
            disabled={hasDisputeBlock}
            styles={{
              root: { width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
              inner: { justifyContent: 'center' },
              label: { display: 'none' },
              section: { margin: 0 },
            }}
            leftSection={<IconList size={14} />}
          >
            {null}
          </Button>
        </Tooltip>
      </Stack>
    );
  }

  // ----- Full mode (default sidebar) -----
  return (
    <Paper withBorder p="sm" style={{ minWidth: LAYOUT.GUTTER_WIDE }}>
      <Stack gap="md">
        <div>
          <Text size="sm" fw={FW.HEADING} mb={4}>
            Smart Tags
          </Text>
          <Text size="xxs" c="dimmed" fw={FW.BODY}>
            Click to insert at cursor
          </Text>
        </div>

        {/* Context indicator badge */}
        <Badge
          variant="light"
          color={isInsideDisputeBlock ? 'violet' : 'blue'}
          size="sm"
          leftSection={isInsideDisputeBlock ? <IconRepeat size={12} /> : <IconUser size={12} />}
          fullWidth
          styles={{ root: { textTransform: 'none', fontWeight: FW.LABEL } }}
        >
          {isInsideDisputeBlock ? 'Inside dispute block' : 'Document scope'}
        </Badge>

        <Divider />

        {/* ---- Context: INSIDE dispute block ---- */}
        <Transition mounted={isInsideDisputeBlock} transition="fade" duration={150}>
          {(styles) => (
            <Box style={styles}>
              {perItemTags.length > 0 ? (
                renderTagGroup('Dispute Item Fields', perItemTags)
              ) : (
                <Text size="xs" c="dimmed" fs="italic">
                  Select dispute types in Letter Settings to see per-item tags.
                </Text>
              )}
            </Box>
          )}
        </Transition>

        {/* ---- Context: OUTSIDE dispute block ---- */}
        <Transition mounted={!isInsideDisputeBlock} transition="fade" duration={150}>
          {(styles) => (
            <Box style={styles}>
              <Stack gap="md">
                {renderTagGroup('Client Info', CLIENT_INFO_TAGS)}
                <Divider />
                {renderTagGroup('System', SYSTEM_TAGS)}
              </Stack>
            </Box>
          )}
        </Transition>

        <Divider />

        {/* Insert Dispute Items Section button — always visible */}
        <Stack gap={4}>
          <Text size="xs" c="dimmed" fw={FW.BODY} tt="uppercase" mb={4}>
            Dispute Items
          </Text>
          <Tooltip
            label={
              hasDisputeBlock
                ? 'Already added — only one per template'
                : 'Insert a repeating section for dispute items'
            }
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
                root: { height: 'auto', padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)' },
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

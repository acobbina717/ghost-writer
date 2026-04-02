'use client';

import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ActionIcon,
  Badge,
  Box,
  Collapse,
  Grid,
  ScrollArea,
  SegmentedControl,
  Stack,
  Title,
  Text,
  TextInput,
  Tooltip,
  MultiSelect,
  NumberInput,
  Button,
  Group,
  Paper,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconCheck, IconDeviceFloppy, IconFlask, IconEdit, IconEye, IconSunglasses, IconTags, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { TiptapEditor, SmartTagsSidebar } from '@/components/TiptapEditor';
import { LAYOUT, Z, FW } from '@/theme/ghost-theme';
import type { ConvexLetter } from '@/lib/convex-types';
import { hydrateTemplate, findUnresolvedTags } from '@/lib/hydrateTemplate';
import type { HydrationData } from '@/lib/hydrateTemplate';
import { wrapHtmlForPreview } from '@/lib/pdf-utils';
import {
  DISPUTE_TYPES,
  DISPUTE_ITEM_SCHEMAS,
  getSchemaGroupName,
  getSchemaGroupForType,
} from '../../../convex/constants';
import { CRA_LABELS } from '@/lib/constants';
import type { Editor } from '@tiptap/react';

// Only Big 3 CRAs for this phase
const CRA_OPTIONS = Object.entries(CRA_LABELS)
  .filter(([value]) => ['experian', 'equifax', 'transunion'].includes(value))
  .map(([value, { label }]) => ({ value, label }));

/**
 * Filter dispute type options: after the first selection, only show
 * types in the same schema group.
 */
function getFilteredDisputeTypes(selected: string[]): string[] {
  if (selected.length === 0) return [...DISPUTE_TYPES];
  const group = getSchemaGroupName(selected[0]);
  if (!group) return [...DISPUTE_TYPES];
  const schema = DISPUTE_ITEM_SCHEMAS.find(s => s.group === group);
  return schema ? schema.types : [...DISPUTE_TYPES];
}

function buildSampleData(disputeTypes: string[]): HydrationData {
  const schema = disputeTypes.length > 0 ? getSchemaGroupForType(disputeTypes[0]) : undefined;

  // Build sample dispute items based on the schema group
  const sampleItems = [];
  if (schema?.group === 'inquiry') {
    sampleItems.push(
      { creditorName: 'Capital One', inquiryDate: '01/15/2025' },
      { creditorName: 'Discover Financial', inquiryDate: '03/22/2025' },
    );
  } else if (schema?.group === 'late_payment') {
    sampleItems.push(
      { creditorName: 'Chase', monthsLate: '60', monthLate: '03/2024' },
      { creditorName: 'Wells Fargo', monthsLate: '30', monthLate: '07/2024' },
    );
  } else {
    sampleItems.push(
      { creditorName: 'Sample Creditor Inc.', accountNumber: 'XXXX-1234', dateOpened: '06/2020', balance: '$4,500' },
      { creditorName: 'Another Company LLC', accountNumber: 'XXXX-5678', dateOpened: '01/2019', balance: '$2,100' },
    );
  }

  return {
    firstName: 'Jane',
    lastName: 'Sample',
    address1: '123 Example St',
    city: 'Anytown',
    state: 'NY',
    zipCode: '10001',
    last4SSN: '1234',
    email: 'jane.sample@example.com',
    phone: '(555) 123-4567',
    dateOfBirth: '01/15/1990',
    disputeType: disputeTypes[0] || 'Collection',
    disputeItems: sampleItems,
  };
}

interface LetterFormProps {
  mode: 'create' | 'edit';
  letter?: ConvexLetter;
}

export function LetterForm({ mode, letter }: LetterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createLetter = useMutation(api.letters.createLetter);
  const updateLetter = useMutation(api.letters.updateLetter);

  // Form state
  const [title, setTitle] = useState(letter?.title || '');
  const [content, setContent] = useState(letter?.content || '');
  const [disputeTypes, setDisputeTypes] = useState<string[]>(
    (letter?.disputeTypes as string[]) || []
  );
  const [applicableCRAs, setApplicableCRAs] = useState<string[]>(
    (letter?.applicableCRAs as string[]) || []
  );
  const [maxDisputeItems, setMaxDisputeItems] = useState<number | undefined>(
    (letter?.maxDisputeItems as number | undefined) ?? undefined
  );

  // Editor instance ref for SmartTagsSidebar
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const handleEditorReady = useCallback((editor: Editor | null) => {
    setEditorInstance(editor);
  }, []);

  // Filtered dispute type options based on schema group enforcement
  const filteredDisputeTypes = useMemo(
    () => getFilteredDisputeTypes(disputeTypes),
    [disputeTypes],
  );

  const handleDisputeTypesChange = (values: string[]) => {
    // If removing types, just update
    if (values.length <= disputeTypes.length) {
      setDisputeTypes(values);
      return;
    }
    // When adding a new type, filter might restrict options — just set directly
    setDisputeTypes(values);
  };

  const [dimPreview, setDimPreview] = useState(false);
  const livePreviewHtml = useLivePreview(content, disputeTypes);
  const isDesktop = useMediaQuery('(min-width: 75em)') ?? true;
  const [mobileView, setMobileView] = useState<string>('editor');

  // Responsive breakpoints for smart tags gutter
  const isWide = useMediaQuery('(min-width: 1440px)');
  const isMedium = useMediaQuery('(min-width: 1280px) and (max-width: 1439px)');
  // Below 1280px = narrow (horizontal strip below toolbar)
  const isNarrow = !isWide && !isMedium;

  // Collapse state for horizontal tags strip on narrow screens
  const [tagsExpanded, { toggle: toggleTags }] = useDisclosure(false);

  const handleTestGeneration = () => {
    if (!content.trim() || content === '<p></p>') {
      notifications.show({ title: 'No Content', message: 'Add content to the letter before testing.', color: 'yellow' });
      return;
    }

    const sampleData = buildSampleData(disputeTypes);
    const hydrated = hydrateTemplate(content, sampleData);
    const unresolved = findUnresolvedTags(hydrated);

    if (unresolved.length === 0) {
      notifications.show({
        title: 'Test Passed',
        message: 'All tags resolved successfully with sample data.',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } else {
      notifications.show({
        title: 'Unresolved Tags Found',
        message: `The following tags were not resolved: ${unresolved.map(t => `{{${t}}}`).join(', ')}`,
        color: 'yellow',
        autoClose: 8000,
      });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      notifications.show({ title: 'Validation Error', message: 'Please enter a title for the letter.', color: 'red' });
      return;
    }
    if (!content.trim() || content === '<p></p>') {
      notifications.show({ title: 'Validation Error', message: 'Please enter content for the letter.', color: 'red' });
      return;
    }
    if (disputeTypes.length === 0) {
      notifications.show({ title: 'Validation Error', message: 'Please select at least one dispute type.', color: 'red' });
      return;
    }
    if (applicableCRAs.length === 0) {
      notifications.show({ title: 'Validation Error', message: 'Please select at least one CRA.', color: 'red' });
      return;
    }

    setIsSubmitting(true);

    try {
      const letterData = {
        title: title.trim(),
        content,
        disputeTypes,
        applicableCRAs,
        maxDisputeItems: maxDisputeItems ?? undefined,
      };

      if (mode === 'create') {
        await createLetter(letterData);
        notifications.show({ title: 'Letter Created', message: `"${title}" has been created.`, color: 'green' });
      } else if (letter) {
        await updateLetter({ ...letterData, id: letter._id as Id<"letters"> });
        notifications.show({ title: 'Letter Updated', message: `"${title}" has been updated.`, color: 'green' });
      }

      router.push('/admin/letters');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to save letter',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="xl" h="calc(100vh - 120px)">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={1} mb="xs">
            {mode === 'create' ? 'Create New Letter' : 'Edit Letter'}
          </Title>
          <Text c="dimmed" size="sm">
            {mode === 'create'
              ? 'Create a new dispute letter template with smart tags.'
              : 'Update the letter template content and settings.'}
          </Text>
        </div>
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push('/admin/letters')}
          >
            Cancel
          </Button>
          <Button
            variant="light"
            leftSection={<IconFlask size={16} />}
            onClick={handleTestGeneration}
          >
            Test Generation
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {mode === 'create' ? 'Create Letter' : 'Save Changes'}
          </Button>
        </Group>
      </Group>

      {/* Letter Settings — compact config header above the desk */}
      <Paper withBorder p="lg">
        <Title order={3} mb="md">Letter Settings</Title>
        <Stack gap="md">
          <TextInput
            label="Title"
            placeholder="e.g., Medical Debt Dispute Letter"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Group grow align="flex-start">
            <MultiSelect
              label="Dispute Types"
              placeholder="Select dispute types"
              data={filteredDisputeTypes}
              value={disputeTypes}
              onChange={handleDisputeTypesChange}
              required
            />
            <MultiSelect
              label="Applicable CRAs"
              placeholder="Select CRAs"
              data={CRA_OPTIONS}
              value={applicableCRAs}
              onChange={setApplicableCRAs}
              required
            />
          </Group>
          <NumberInput
            label="Max Dispute Items Per Letter"
            description="Limit how many items can be included per CRA."
            placeholder="No limit"
            value={maxDisputeItems ?? ''}
            onChange={(val) => setMaxDisputeItems(val === '' ? undefined : Number(val))}
            min={1}
            max={20}
            w={280}
          />
        </Stack>
      </Paper>

      {/* Desk layout: Editor (with gutter tags) + Preview */}
      <Grid gutter="lg" style={{ flex: 1, minHeight: 0, paddingBottom: isDesktop ? undefined : 56 }}>
        {/* LEFT: Desk area (smart tags gutter + paper) */}
        <Grid.Col
          span={{ base: 12, lg: 7 }}
          h="100%"
          style={{ display: isDesktop || mobileView === 'editor' ? undefined : 'none' }}
        >
          <ScrollArea h="100%" type="auto" offsetScrollbars>
            <Stack gap={0} pb="xl">
              {/* Narrow screens: collapsible horizontal smart tags strip */}
              {isNarrow && (
                <Paper withBorder mb="sm" radius="sm">
                  <Button
                    variant="subtle"
                    fullWidth
                    size="compact-sm"
                    onClick={toggleTags}
                    leftSection={<IconTags size={14} />}
                    rightSection={tagsExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                    justify="space-between"
                    styles={{ inner: { justifyContent: 'space-between' }, label: { fontWeight: 500 } }}
                  >
                    Smart Tags
                  </Button>
                  <Collapse in={tagsExpanded}>
                    <SmartTagsSidebar
                      editor={editorInstance}
                      disputeTypes={disputeTypes}
                      displayMode="horizontal"
                    />
                  </Collapse>
                </Paper>
              )}

              {/* The Desk: flex layout with gutter + paper */}
              <Group gap="md" align="flex-start" wrap="nowrap" justify="center">
                {/* Wide screens: full sidebar gutter */}
                {isWide && (
                  <Box style={{ width: LAYOUT.GUTTER_WIDE, flexShrink: 0, position: 'sticky', top: LAYOUT.HEADER_TOTAL + 16 }}>
                    <SmartTagsSidebar
                      editor={editorInstance}
                      disputeTypes={disputeTypes}
                      displayMode="full"
                    />
                  </Box>
                )}

                {/* Medium screens: icon-only gutter */}
                {isMedium && (
                  <Box style={{ width: LAYOUT.GUTTER_MEDIUM, flexShrink: 0, position: 'sticky', top: LAYOUT.HEADER_TOTAL + 16 }}>
                    <Paper withBorder p={4} radius="sm">
                      <SmartTagsSidebar
                        editor={editorInstance}
                        disputeTypes={disputeTypes}
                        displayMode="iconOnly"
                      />
                    </Paper>
                  </Box>
                )}

                {/* The Paper — centered white sheet */}
                <Paper
                  shadow="sm"
                  p="xl"
                  style={{
                    maxWidth: LAYOUT.PAPER_MAX_WIDTH,
                    width: '100%',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                >
                  <TiptapEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Start writing your dispute letter template..."
                    disputeTypes={disputeTypes}
                    hideSidebar
                    onEditorReady={handleEditorReady}
                  />
                </Paper>
              </Group>
            </Stack>
          </ScrollArea>
        </Grid.Col>

        {/* RIGHT: Live Sample Preview */}
        <Grid.Col
          span={{ base: 12, lg: 5 }}
          h="100%"
          style={{ display: isDesktop || mobileView === 'preview' ? undefined : 'none' }}
        >
          <Stack h="100%" gap="md">
            <Group justify="space-between" align="center">
              <Text fw={FW.HEADING} size="sm" tt="uppercase" style={{ letterSpacing: 'var(--ls-wide)' }} c="dimmed">
                LIVE SAMPLE PREVIEW
              </Text>
              <Group gap="sm">
                <Tooltip label="Eye Comfort" withArrow>
                  <ActionIcon
                    variant={dimPreview ? 'filled' : 'subtle'}
                    color={dimPreview ? 'yellow.6' : 'gray'}
                    size="sm"
                    onClick={() => setDimPreview(prev => !prev)}
                    aria-label="Toggle eye comfort mode"
                  >
                    <IconSunglasses size={16} />
                  </ActionIcon>
                </Tooltip>
                <Badge variant="dot" color="action">Template Preview</Badge>
              </Group>
            </Group>

            <Paper
              withBorder
              radius="sm"
              style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
              shadow="sm"
              bg="var(--bg-surface)"
            >
              {/* Sample Letter Watermark */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                fontSize: '4rem',
                fontWeight: 900,
                color: 'var(--text-muted)',
                opacity: 0.03,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                zIndex: 5,
              }}>
                SAMPLE TEMPLATE
              </div>

              <iframe
                sandbox=""
                srcDoc={livePreviewHtml}
                title="Letter preview"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: dimPreview ? 'var(--bg-inset)' : 'var(--bg-surface)',
                  position: 'relative',
                  zIndex: 1,
                  filter: dimPreview ? 'sepia(0.3) brightness(0.9)' : undefined,
                  transition: `filter var(--duration-default) var(--ease-default), background var(--duration-default) var(--ease-default)`,
                }}
              />
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Sticky bottom toggle for mobile */}
      {!isDesktop && (
        <Paper
          p="sm"
          withBorder
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: Z.MOBILE_NAV,
            borderLeft: 0,
            borderRight: 0,
            borderBottom: 0,
          }}
        >
          <SegmentedControl
            value={mobileView}
            onChange={setMobileView}
            data={[
              { value: 'editor', label: <Group gap={6} justify="center"><IconEdit size={16} /> Editor</Group> },
              { value: 'preview', label: <Group gap={6} justify="center"><IconEye size={16} /> Preview</Group> },
            ]}
            fullWidth
          />
        </Paper>
      )}
    </Stack>
  );
}

// Helper outside component
function useLivePreview(content: string, disputeTypes: string[]) {
  return useMemo(() => {
    if (!content) return '';
    const sampleData = buildSampleData(disputeTypes);
    const hydrated = hydrateTemplate(content, sampleData);
    return wrapHtmlForPreview(hydrated, true);
  }, [content, disputeTypes]);
}

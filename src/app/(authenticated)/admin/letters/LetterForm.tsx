'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stack,
  Title,
  Text,
  TextInput,
  MultiSelect,
  NumberInput,
  Button,
  Group,
  Paper,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconDeviceFloppy, IconEye } from '@tabler/icons-react';
import { useMutation } from 'convex/react';
import { PageBreadcrumbs } from '@/components/PageBreadcrumbs/PageBreadcrumbs';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { TiptapEditor } from '@/components/TiptapEditor';
import type { ConvexLetter } from '@/lib/convex-types';
import { hydrateTemplate } from '@/lib/hydrateTemplate';
import type { HydrationData } from '@/lib/hydrateTemplate';
import { wrapHtmlForPreview } from '@/lib/pdf-utils';
import {
  DISPUTE_TYPES,
  DISPUTE_ITEM_SCHEMAS,
  getSchemaGroupName,
  getSchemaGroupForType,
} from '../../../../../convex/constants';
import { CRA_LABELS } from '@/lib/constants';

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
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);
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

  const previewHtml = useMemo(() => {
    if (!previewOpened || !content) return '';
    const sampleData = buildSampleData(disputeTypes);
    const hydrated = hydrateTemplate(content, sampleData);
    return wrapHtmlForPreview(hydrated, true);
  }, [previewOpened, content, disputeTypes]);

  return (
    <Stack gap="xl">
      <PageBreadcrumbs items={[
        { label: 'Letter Library', href: '/admin/letters' },
        { label: mode === 'create' ? 'New Letter' : 'Edit Letter' },
      ]} />

      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={1} mb="xs">
            {mode === 'create' ? 'Create New Letter' : 'Edit Letter'}
          </Title>
          <Text c="dimmed">
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
            leftSection={<IconDeviceFloppy size={16} />}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {mode === 'create' ? 'Create Letter' : 'Save Changes'}
          </Button>
        </Group>
      </Group>

      {/* Section 1: Letter Settings */}
      <Paper withBorder p="lg">
        <Title order={3} mb="md">Letter Settings</Title>
        <Stack gap="md">
          <Group grow align="flex-start">
            <TextInput
              label="Title"
              placeholder="e.g., Medical Debt Dispute Letter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
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
            description="Limit how many items can be included per CRA. Leave empty for no limit."
            placeholder="No limit"
            value={maxDisputeItems ?? ''}
            onChange={(val) => setMaxDisputeItems(val === '' ? undefined : Number(val))}
            min={1}
            max={20}
            w={280}
          />
        </Stack>
      </Paper>

      {/* Section 2: Letter Content */}
      <Paper withBorder p="lg">
        <Title order={3} mb="md">Letter Content</Title>
        <Text size="sm" c="dimmed" mb="md">
          Use the smart tags sidebar to insert dynamic fields. Place the dispute items
          section where repeating item data should appear. The content will be rendered
          with Arial font in the final PDF.
        </Text>
        <TiptapEditor
          content={content}
          onChange={setContent}
          placeholder="Start writing your dispute letter template..."
          disputeTypes={disputeTypes}
        />
        <Group justify="flex-end" mt="md">
          <Button
            variant="light"
            leftSection={<IconEye size={16} />}
            onClick={openPreview}
            disabled={!content || content === '<p></p>'}
          >
            Preview Letter
          </Button>
        </Group>
      </Paper>

      {/* Preview Modal */}
      <Modal
        opened={previewOpened}
        onClose={closePreview}
        title="Letter Preview"
        size="xl"
      >
        <Text size="xs" c="dimmed" mb="sm">
          Preview uses sample data. Smart tags are replaced with placeholder values.
        </Text>
        <iframe
          srcDoc={previewHtml}
          title="Letter preview"
          style={{
            width: '100%',
            height: 800,
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-sm)',
            background: 'white',
          }}
        />
      </Modal>
    </Stack>
  );
}

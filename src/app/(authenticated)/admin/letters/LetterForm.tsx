'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stack,
  Title,
  Text,
  TextInput,
  MultiSelect,
  Button,
  Group,
  Paper,
  Breadcrumbs,
  Anchor,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import Link from 'next/link';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { TiptapEditor } from '@/components/TiptapEditor';
import { FormSchemaInput } from '@/components/TiptapEditor/FormSchemaInput';
import type { ConvexLetter, FormSchemaField } from '@/lib/convex-types';

interface LetterFormProps {
  mode: 'create' | 'edit';
  letter?: ConvexLetter;
}

const CRA_OPTIONS = [
  { value: 'experian', label: 'Experian' },
  { value: 'equifax', label: 'Equifax' },
  { value: 'transunion', label: 'TransUnion' },
] as const;

type CRAValue = 'experian' | 'equifax' | 'transunion';

export function LetterForm({ mode, letter }: LetterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createLetter = useMutation(api.letters.createLetter);
  const updateLetter = useMutation(api.letters.updateLetter);

  // Form state
  const [title, setTitle] = useState(letter?.title || '');
  const [content, setContent] = useState(letter?.content || '');
  const [applicableCRAs, setApplicableCRAs] = useState<CRAValue[]>(
    (letter?.applicableCRAs as CRAValue[]) || []
  );
  const [formSchema, setFormSchema] = useState<FormSchemaField[] | null>(
    (letter?.formSchema as FormSchemaField[] | null) || null
  );

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter a title for the letter.',
        color: 'red',
      });
      return;
    }

    if (!content.trim() || content === '<p></p>') {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter content for the letter.',
        color: 'red',
      });
      return;
    }

    if (applicableCRAs.length === 0) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please select at least one CRA.',
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const letterData = {
        title: title.trim(),
        content,
        applicableCRAs,
        formSchema: formSchema || undefined,
      };

      if (mode === 'create') {
        await createLetter(letterData);
        notifications.show({
          title: 'Letter Created',
          message: `"${title}" has been created successfully.`,
          color: 'green',
        });
      } else if (letter) {
        await updateLetter({ ...letterData, id: letter._id as Id<"letters"> });
        notifications.show({
          title: 'Letter Updated',
          message: `"${title}" has been updated successfully.`,
          color: 'green',
        });
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

  // Get custom tags from formSchema for the editor sidebar
  const customTags = formSchema?.map((field) => ({
    tagId: field.tagId,
    label: field.label,
  })) || [];

  return (
    <Stack gap="xl">
      {/* Breadcrumbs */}
      <Breadcrumbs>
        <Anchor component={Link} href="/admin/letters" size="sm">
          Letter Library
        </Anchor>
        <Text size="sm">{mode === 'create' ? 'New Letter' : 'Edit Letter'}</Text>
      </Breadcrumbs>

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

      {/* Letter Settings */}
      <Paper withBorder p="lg">
        <Title order={3} mb="md">
          Letter Settings
        </Title>
        <Group grow align="flex-start">
          <TextInput
            label="Title"
            placeholder="e.g., Medical Debt Dispute Letter"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <MultiSelect
            label="Applicable CRAs"
            placeholder="Select CRAs"
            data={CRA_OPTIONS}
            value={applicableCRAs}
            onChange={(values) => setApplicableCRAs(values as CRAValue[])}
            required
          />
        </Group>
      </Paper>

      {/* Letter Content */}
      <Paper withBorder p="lg">
        <Title order={3} mb="md">
          Letter Content
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Use the smart tags sidebar to insert dynamic fields. The content will be
          rendered with Arial font in the final PDF.
        </Text>
        <TiptapEditor
          content={content}
          onChange={setContent}
          placeholder="Start writing your dispute letter template..."
          customTags={customTags}
        />
      </Paper>

      {/* Custom Form Fields */}
      <Paper withBorder p="lg">
        <Title order={3} mb="xs">
          Custom Form Fields
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Define custom input fields that team members will fill out when using this
          template. Each field creates a smart tag that can be inserted into the
          letter content.
        </Text>
        <FormSchemaInput value={formSchema} onChange={setFormSchema} />
      </Paper>

      {/* Bottom Actions */}
      <Group justify="flex-end">
        <Button
          variant="subtle"
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
    </Stack>
  );
}

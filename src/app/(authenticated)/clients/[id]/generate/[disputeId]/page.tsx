'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Stack, Title, Paper, Button, Group, Anchor, Center, Loader, Text, Alert } from '@mantine/core';
import { IconArrowLeft, IconEye, IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../../convex/_generated/dataModel';
import { DynamicForm, validateDynamicForm, type FormField } from '@/components/DynamicForm';

export default function LetterGenerationPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const clientId = params.id as Id<"clients">;
  const disputeId = params.disputeId as Id<"disputeItems">;
  const letterId = searchParams.get('letterId') as Id<"letters"> | null;

  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch data
  const client = useQuery(api.clients.getClient, { clientId });
  const disputeItems = useQuery(api.clients.getDisputeItemsByClient, { clientId });
  const letter = letterId ? useQuery(api.letters.getLetter, { id: letterId }) : undefined;

  // Find the specific dispute item
  const dispute = disputeItems?.find(d => d._id === disputeId);

  // Redirect if missing required data
  useEffect(() => {
    if (client === null || (disputeItems && !dispute)) {
      router.push(`/clients/${clientId}`);
    }
    if (!letterId) {
      router.push(`/clients/${clientId}`);
    }
  }, [client, dispute, disputeItems, letterId, router, clientId]);

  const handleFormChange = (tagId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [tagId]: value }));
    // Clear error for this field if it exists
    if (formErrors[tagId]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[tagId];
        return next;
      });
    }
  };

  const handlePreview = () => {
    // Validate form if schema exists
    if (letter?.formSchema && Array.isArray(letter.formSchema)) {
      const errors = validateDynamicForm(letter.formSchema as FormField[], formValues);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
    }

    // Navigate to preview with form data in state
    const queryParams = new URLSearchParams({
      letterId: letterId || '',
      formData: JSON.stringify(formValues),
    });
    router.push(`/clients/${clientId}/generate/${disputeId}/preview?${queryParams.toString()}`);
  };

  // Loading state
  if (
    client === undefined ||
    disputeItems === undefined ||
    letter === undefined ||
    !dispute
  ) {
    return (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    );
  }

  const formSchema = (letter.formSchema && Array.isArray(letter.formSchema)) 
    ? letter.formSchema as FormField[] 
    : [];

  return (
    <Stack gap="xl">
      {/* Back Link */}
      <Anchor component={Link} href={`/clients/${clientId}`} size="sm" c="dimmed">
        <Group gap="xs">
          <IconArrowLeft size={16} />
          Back to Client
        </Group>
      </Anchor>

      {/* Header */}
      <div>
        <Title order={2}>{letter.title}</Title>
        <Text c="dimmed" size="sm" mt="xs">
          For: {client.firstName} {client.lastName} • {dispute.disputeType}
        </Text>
      </div>

      {/* Form */}
      <Paper withBorder p="lg" radius="sm">
        <Stack gap="lg">
          <div>
            <Title order={4}>Custom Fields</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Fill in the required information for this letter template.
            </Text>
          </div>

          {formSchema.length === 0 ? (
            <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
              No custom fields required for this letter. Click "Preview" to continue.
            </Alert>
          ) : (
            <DynamicForm
              schema={formSchema}
              values={formValues}
              onChange={handleFormChange}
              errors={formErrors}
            />
          )}

          <Group justify="flex-end">
            <Button
              leftSection={<IconEye size={16} />}
              onClick={handlePreview}
            >
              Preview Letter
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}

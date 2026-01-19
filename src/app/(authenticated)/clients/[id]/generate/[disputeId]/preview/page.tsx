'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Stack, Title, Paper, Button, Group, Anchor, Center, Loader, Text, Alert } from '@mantine/core';
import { IconArrowLeft, IconDownload, IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../../../convex/_generated/dataModel';
import { hydrateTemplate, findUnresolvedTags, type HydrationData } from '@/lib/hydrateTemplate';
import { notifications } from '@mantine/notifications';

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const clientId = params.id as Id<"clients">;
  const disputeId = params.disputeId as Id<"disputeItems">;
  const letterId = searchParams.get('letterId') as Id<"letters"> | null;
  const formDataStr = searchParams.get('formData');

  const [isGenerating, setIsGenerating] = useState(false);

  // Parse form data
  const formAnswers = useMemo(() => {
    try {
      return formDataStr ? JSON.parse(formDataStr) : {};
    } catch {
      return {};
    }
  }, [formDataStr]);

  // Fetch data
  const client = useQuery(api.clients.getClient, { clientId });
  const disputeItems = useQuery(api.clients.getDisputeItemsByClient, { clientId });
  const letter = letterId ? useQuery(api.letters.getLetter, { id: letterId }) : undefined;

  // Actions/Mutations
  const generatePdf = useAction(api.pdf.generatePdf);
  const logGeneration = useMutation(api.letters.logGeneration);

  // Find the specific dispute item
  const dispute = disputeItems?.find(d => d._id === disputeId);

  // Hydrate template
  const hydratedHtml = useMemo(() => {
    if (!client || !dispute || !letter) return '';

    const data: HydrationData = {
      firstName: client.firstName,
      lastName: client.lastName,
      address1: client.address1,
      address2: client.address2,
      city: client.city,
      state: client.state,
      zipCode: client.zipCode,
      last4SSN: client.last4SSN,
      disputeType: dispute.disputeType,
      creditorName: dispute.creditorName,
      accountNumber: dispute.accountNumber,
      currentRound: dispute.currentRound,
      formAnswers,
    };

    return hydrateTemplate(letter.content, data);
  }, [client, dispute, letter, formAnswers]);

  // Check for unresolved tags
  const unresolvedTags = useMemo(() => {
    return findUnresolvedTags(hydratedHtml);
  }, [hydratedHtml]);

  // Redirect if missing required data
  useEffect(() => {
    if (client === null || (disputeItems && !dispute) || !letterId) {
      router.push(`/clients/${clientId}`);
    }
  }, [client, dispute, disputeItems, letterId, router, clientId]);

  const handleDownloadPdf = async () => {
    if (!letterId || !dispute) return;

    setIsGenerating(true);
    try {
      // Generate PDF via Browserless
      const result = await generatePdf({ html: hydratedHtml });

      // Decode base64 and trigger download
      const byteCharacters = atob(result.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log generation
      await logGeneration({
        clientId,
        letterId,
        disputeItemIds: [disputeId],
        formAnswers,
      });

      notifications.show({
        title: 'Success',
        message: 'PDF downloaded successfully',
        color: 'green',
      });

      // Navigate back to client page
      router.push(`/clients/${clientId}`);
    } catch (error) {
      console.error('PDF generation error:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
        color: 'red',
      });
    } finally {
      setIsGenerating(false);
    }
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

  return (
    <Stack gap="xl">
      {/* Back Link */}
      <Anchor
        component={Link}
        href={`/clients/${clientId}/generate/${disputeId}?letterId=${letterId}`}
        size="sm"
        c="dimmed"
      >
        <Group gap="xs">
          <IconArrowLeft size={16} />
          Back to Form
        </Group>
      </Anchor>

      {/* Header */}
      <div>
        <Title order={2}>Preview Letter</Title>
        <Text c="dimmed" size="sm" mt="xs">
          Review the letter before downloading the PDF
        </Text>
      </div>

      {/* Unresolved Tags Warning */}
      {unresolvedTags.length > 0 && (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
          <Text size="sm" fw={500}>Warning: Unresolved tags detected</Text>
          <Text size="xs" mt="xs">
            The following tags were not replaced: {unresolvedTags.map(tag => `{{${tag}}}`).join(', ')}
          </Text>
        </Alert>
      )}

      {/* Preview */}
      <Paper withBorder radius="sm" style={{ overflow: 'hidden' }}>
        <iframe
          srcDoc={`
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    font-size: 12pt;
                    line-height: 1.6;
                    padding: 1in;
                    margin: 0;
                  }
                  p { margin: 0 0 1em 0; }
                  h1, h2, h3 { margin: 1em 0 0.5em 0; }
                </style>
              </head>
              <body>${hydratedHtml}</body>
            </html>
          `}
          style={{
            width: '100%',
            height: '600px',
            border: 'none',
            backgroundColor: 'white',
          }}
          title="Letter Preview"
        />
      </Paper>

      {/* Actions */}
      <Group justify="space-between">
        <Button
          variant="subtle"
          component={Link}
          href={`/clients/${clientId}/generate/${disputeId}?letterId=${letterId}`}
        >
          Edit Form
        </Button>
        <Button
          leftSection={<IconDownload size={16} />}
          onClick={handleDownloadPdf}
          loading={isGenerating}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating PDF...' : 'Download PDF'}
        </Button>
      </Group>
    </Stack>
  );
}

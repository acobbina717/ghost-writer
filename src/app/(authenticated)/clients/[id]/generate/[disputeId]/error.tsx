'use client';

import { useEffect } from 'react';
import { Container, Title, Text, Button, Stack, Paper } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';

export default function GenerateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry (already configured)
    console.error('Letter generation error:', error);
  }, [error]);

  return (
    <Container size="sm" py="xl">
      <Paper withBorder p="xl" radius="md">
        <Stack align="center" gap="lg">
          <IconAlertCircle size={48} color="red" />
          <div style={{ textAlign: 'center' }}>
            <Title order={2} mb="xs">
              Something went wrong
            </Title>
            <Text c="dimmed" size="sm">
              {error.message || 'An error occurred while generating the letter'}
            </Text>
          </div>
          <Button onClick={reset}>Try again</Button>
          <Button variant="subtle" component={Link} href="/dashboard">
            Return to Dashboard
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}

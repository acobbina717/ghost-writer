'use client';

import { Center, Loader, Stack, Text } from '@mantine/core';

interface FullPageLoaderProps {
  message?: string;
  color?: string;
  withBackground?: boolean;
}

/**
 * Full-page centered loading spinner.
 * Use for page transitions and loading states.
 */
export function FullPageLoader({ 
  message, 
  color = 'red',
  withBackground = true,
}: FullPageLoaderProps) {
  return (
    <Center h="100vh" bg={withBackground ? 'var(--bg-base)' : undefined}>
      {message ? (
        <Stack align="center" gap="md">
          <Loader color={color} size="lg" />
          <Text c="dimmed" size="sm">{message}</Text>
        </Stack>
      ) : (
        <Loader color={color} size="lg" />
      )}
    </Center>
  );
}


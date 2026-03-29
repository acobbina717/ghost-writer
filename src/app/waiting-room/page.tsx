'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Card, Stack, Title, Text, ThemeIcon, Group, Badge, Loader, Box, Center } from '@mantine/core';
import { IconClock } from '@tabler/icons-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { getSocialIcon } from '@/lib/utils';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle';
import { StatusPoller } from './StatusPoller';
import { SignOutLink } from './SignOutLink';

export default function WaitingRoomPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const user = useQuery(api.users.getCurrentUser);

  // Redirect if not signed in
  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [authLoaded, isSignedIn, router]);

  // Redirect if user is not pending (e.g., already approved)
  useEffect(() => {
    if (user && user.role !== 'pending') {
      router.push('/dashboard');
    }
    // If user doesn't exist in DB yet, redirect to onboarding
    if (user === null) {
      router.push('/onboarding');
    }
  }, [user, router]);

  // Loading state
  if (!authLoaded || user === undefined) {
    return <Center h="100vh" bg="var(--bg-base)"><Loader size="lg" /></Center>;
  }

  // Don't render if user is not pending
  if (!user || user.role !== 'pending') {
    return <Center h="100vh" bg="var(--bg-base)"><Loader size="lg" /></Center>;
  }

  return (
    <Box style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <StatusPoller />
      <ColorSchemeToggle position="absolute" />
      <Center
        style={{
          minHeight: '100vh',
          padding: '1rem',
        }}
      >
        <Card
        withBorder
        shadow="lg"
        padding="xl"
        radius="md"
        style={{ maxWidth: 440, width: '100%' }}
      >
        <Stack align="center" gap="lg">
          <ThemeIcon
            variant="light"
            size={80}
            radius="xl"
            color="yellow"
          >
            <IconClock size={40} />
          </ThemeIcon>

          <Stack align="center" gap="xs">
            <Title order={2} ta="center">
              Awaiting Approval
            </Title>
            <Text c="dimmed" ta="center" size="sm">
              Your account is pending verification
            </Text>
          </Stack>

          <Card withBorder padding="md" radius="sm" w="100%">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                  Username
                </Text>
                <Text size="sm" fw={500}>
                  {user.username}
                </Text>
              </Group>
              
              <Group justify="space-between">
                <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                  Email
                </Text>
                <Text size="sm" fw={500}>
                  {user.email}
                </Text>
              </Group>

              <Group justify="space-between">
                <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                  Verification Handle
                </Text>
                <Badge
                  variant="light"
                  leftSection={getSocialIcon(user.socialPlatform)}
                >
                  {user.socialHandle}
                </Badge>
              </Group>

              <Group justify="space-between">
                <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                  Status
                </Text>
                <Badge color="yellow" variant="filled">
                  Pending
                </Badge>
              </Group>
            </Stack>
          </Card>

          <Stack gap="md" align="center" w="100%">
            <Group gap="xs" align="center">
              <Loader size="xs" color="yellow" />
              <Text size="xs" c="dimmed">
                Ghost will verify your identity via your social handle
              </Text>
            </Group>

            <Text size="xs" c="dimmed" ta="center">
              This page will automatically redirect once your account is approved.
            </Text>

            <SignOutLink />
          </Stack>
        </Stack>
      </Card>
      </Center>
    </Box>
  );
}

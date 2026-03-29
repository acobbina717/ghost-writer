'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Center,
  Card,
  Loader,
  Stack,
  Title,
  Text,
  TextInput,
  Select,
  Button,
  Box,
  ThemeIcon,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUserCheck, IconBrandTelegram, IconBrandDiscord, IconBrandInstagram } from '@tabler/icons-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle';

import { SOCIAL_PLATFORMS } from '../../../convex/constants';

interface OnboardingFormProps {
  userName: string;
}

export function OnboardingForm({ userName }: OnboardingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  
  // Check if user already exists in Convex (single source of truth)
  const existingUser = useQuery(api.users.getCurrentUser);

  // Redirect if user already exists based on their role
  useEffect(() => {
    if (existingUser) {
      if (existingUser.role === 'pending') {
        router.replace('/waiting-room');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [existingUser, router]);

  const form = useForm({
    initialValues: {
      socialPlatform: '',
      socialHandle: '',
    },
    validate: {
      socialPlatform: (value) => (!value ? 'Please select a platform' : null),
      socialHandle: (value) => {
        if (!value) return 'Please enter your handle';
        if (value.length < 2) return 'Handle must be at least 2 characters';
        return null;
      },
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // Normalize handle: ensure it starts with @
      const normalizedHandle = values.socialHandle.startsWith('@') 
        ? values.socialHandle 
        : `@${values.socialHandle}`;
      
      const result = await completeOnboarding({
        socialPlatform: values.socialPlatform,
        socialHandle: normalizedHandle,
      });
      
      if (result.success) {
        notifications.show({
          title: 'Profile Complete',
          message: 'Redirecting...',
          color: 'green',
        });
        // Redirect based on returned role
        if (result.role === 'admin') {
          router.push('/dashboard');
        } else {
          router.push('/waiting-room');
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking if user exists
  if (existingUser === undefined) {
    return <Center h="100vh" bg="var(--bg-base)"><Loader size="lg" /></Center>;
  }

  // If user exists, show loading while redirecting
  if (existingUser) {
    return (
      <Center h="100vh" bg="var(--bg-base)">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed" size="sm">Redirecting...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box style={{ position: 'relative', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <ColorSchemeToggle position="absolute" />
      <Center style={{ minHeight: '100vh', padding: '1rem' }}>
        <Card
          withBorder
          shadow="lg"
          padding="xl"
          radius="md"
          style={{ maxWidth: 440, width: '100%' }}
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              <Stack align="center" gap="md">
                <ThemeIcon variant="light" size={64} radius="xl">
                  <IconUserCheck size={32} />
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                  <Title order={2}>Welcome, {userName}!</Title>
                  <Text c="dimmed" size="sm" mt="xs">
                    Complete your profile for identity verification
                  </Text>
                </div>
              </Stack>

              <Select
                label="Social Platform"
                placeholder="Select your platform"
                data={[...SOCIAL_PLATFORMS]}
                leftSection={
                  form.values.socialPlatform === 'telegram' ? <IconBrandTelegram size={16} /> :
                  form.values.socialPlatform === 'discord' ? <IconBrandDiscord size={16} /> :
                  form.values.socialPlatform === 'instagram' ? <IconBrandInstagram size={16} /> :
                  null
                }
                required
                {...form.getInputProps('socialPlatform')}
              />

              <TextInput
                label="Social Handle"
                placeholder="@username"
                description="Ghost will use this to verify your identity"
                required
                {...form.getInputProps('socialHandle')}
              />

              <Button type="submit" fullWidth loading={loading} mt="md">
                Complete Profile
              </Button>

              <Text size="xs" c="dimmed" ta="center">
                After completing your profile, you&apos;ll be placed in the waiting room
                until Ghost approves your access.
              </Text>
            </Stack>
          </form>
        </Card>
      </Center>
    </Box>
  );
}

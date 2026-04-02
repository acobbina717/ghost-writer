'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Title, Text, Stack, Group, Center, Loader } from '@mantine/core';
import { IconPlus, IconFileText } from '@tabler/icons-react';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/nextjs';
import { api } from '../../../../../convex/_generated/api';
import { LettersTable } from '@/components/AdminLetters/LettersTable';
import { EmptyState } from '@/components/EmptyState';
import { LinkButton } from '@/components/LinkButton';

export default function AdminLettersPage() {
  const router = useRouter();
  const { isLoaded: isAuthLoaded } = useAuth();
  const user = useQuery(api.users.getCurrentUser);
  const letters = useQuery(api.letters.getLetters);
  const templateStats = useQuery(api.letters.getTemplateStats);

  // Redirect non-admins to dashboard (only after auth is loaded)
  useEffect(() => {
    if (isAuthLoaded && user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthLoaded, user, router]);

  // Loading state
  const isLoading = !isAuthLoaded || !user || user.role !== 'admin' || letters === undefined || templateStats === undefined;

  if (isLoading) {
    return (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={1} mb="xs">
            Letter Library
          </Title>
          <Text c="dimmed">
            Create and manage dispute letter templates with smart tags.
          </Text>
        </div>
        <LinkButton
          href="/admin/letters/new"
          leftSection={<IconPlus size={16} />}
        >
          New Letter
        </LinkButton>
      </Group>

      {letters.length === 0 ? (
        <EmptyState
          icon={<IconFileText size={48} />}
          title="No Letters Yet"
          description="Ghost needs templates to work with. Create your first letter using smart tags like {{client_name}} to auto-fill client data."
          action={{
            label: 'Create First Letter',
            href: '/admin/letters/new',
            icon: <IconPlus size={16} />,
          }}
        />
      ) : (
        <LettersTable letters={letters} templateStats={templateStats} />
      )}
    </Stack>
  );
}

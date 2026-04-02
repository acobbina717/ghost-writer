'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Loader } from '@mantine/core';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/nextjs';
import { api } from '../../../../../../convex/_generated/api';
import { LetterForm } from '@/components/AdminLetters/LetterForm';

export default function NewLetterPage() {
  const router = useRouter();
  const { isLoaded: isAuthLoaded } = useAuth();
  const user = useQuery(api.users.getCurrentUser);

  // Redirect non-admins to dashboard (only after auth is loaded)
  useEffect(() => {
    if (isAuthLoaded && user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthLoaded, user, router]);

  // Loading state
  if (!isAuthLoaded || !user || user.role !== 'admin') {
    return (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return <LetterForm mode="create" />;
}

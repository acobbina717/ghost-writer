'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Center, Loader } from '@mantine/core';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/nextjs';
import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import { LetterForm } from '@/components/AdminLetters/LetterForm';

export default function EditLetterPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as Id<"letters">;
  
  const { isLoaded: isAuthLoaded } = useAuth();
  const user = useQuery(api.users.getCurrentUser);
  const letter = useQuery(api.letters.getLetter, { id });

  // Redirect non-admins to dashboard (only after auth is loaded)
  useEffect(() => {
    if (isAuthLoaded && user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthLoaded, user, router]);

  // Redirect if letter not found
  useEffect(() => {
    if (letter === null) {
      router.push('/admin/letters');
    }
  }, [letter, router]);

  // Loading state
  const isLoading = !isAuthLoaded || !user || user.role !== 'admin' || 
    letter === undefined || letter === null;

  if (isLoading) {
    return (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return <LetterForm mode="edit" letter={letter} />;
}

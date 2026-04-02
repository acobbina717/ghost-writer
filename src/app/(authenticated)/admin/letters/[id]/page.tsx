'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Center, Loader } from '@mantine/core';
import { useQuery } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import { LetterForm } from '@/components/AdminLetters/LetterForm';

export default function EditLetterPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as Id<"letters">;

  const letter = useQuery(api.letters.getLetter, { id });

  useEffect(() => {
    if (letter === null) {
      router.push('/admin/letters');
    }
  }, [letter, router]);

  if (letter === undefined || letter === null) {
    return <Center h="50vh"><Loader size="lg" /></Center>;
  }

  return <LetterForm mode="edit" letter={letter} />;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/nextjs';
import { Center, Loader } from '@mantine/core';
import { api } from '../../../../convex/_generated/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoaded: isAuthLoaded } = useAuth();
  const user = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (isAuthLoaded && user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthLoaded, user, router]);

  if (!isAuthLoaded || user === undefined || (user && user.role !== 'admin')) {
    return <Center h="50vh"><Loader size="lg" /></Center>;
  }

  return <>{children}</>;
}

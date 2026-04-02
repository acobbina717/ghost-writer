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
    if (!isAuthLoaded || user === undefined) return;
    if (!user || user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [isAuthLoaded, user, router]);

  // Show loader while auth loads OR while redirect is in-flight (non-admin)
  if (!isAuthLoaded || user === undefined || !user || user.role !== 'admin') {
    return <Center h="50vh"><Loader size="lg" /></Center>;
  }

  return <>{children}</>;
}

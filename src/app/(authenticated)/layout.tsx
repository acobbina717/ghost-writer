'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { useAuth } from '@clerk/nextjs';
import { api } from '../../../convex/_generated/api';
import { Center, Loader } from '@mantine/core';
import { AppShellLayout } from '@/components/AppShell';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoaded: isAuthLoaded } = useAuth();
  const user = useQuery(api.users.getCurrentUser);

  // Redirect based on user status (only after auth is fully loaded)
  useEffect(() => {
    if (!isAuthLoaded || user === undefined) return;

    if (!user) {
      router.push('/onboarding');
    } else if (user.role === 'pending') {
      router.push('/waiting-room');
    }
  }, [isAuthLoaded, user, router]);

  // Loading state - wait for both Clerk auth AND Convex query
  if (!isAuthLoaded || user === undefined) {
    return <Center h="100vh"><Loader size="lg" /></Center>;
  }

  // Don't render children if user is not authorized
  if (!user || user.role === 'pending') {
    return <Center h="100vh"><Loader size="lg" /></Center>;
  }

  return (
    <AppShellLayout userRole={user.role}>
      {children}
    </AppShellLayout>
  );
}

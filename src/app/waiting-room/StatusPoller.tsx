'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

/**
 * StatusWatcher - Real-time component that watches for user status changes.
 * 
 * When the user's role changes from 'pending' to 'team' or 'admin',
 * automatically redirects them to the dashboard.
 * 
 * Uses Convex real-time subscriptions - no polling needed!
 */
export function StatusPoller() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (user?.role && user.role !== 'pending') {
      // User has been approved! Redirect to dashboard
      router.push('/dashboard');
    }
  }, [user?.role, router]);

  // This component renders nothing - it only handles the real-time logic
  return null;
}

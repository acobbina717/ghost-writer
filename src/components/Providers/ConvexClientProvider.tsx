'use client';

import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useAuth } from '@clerk/nextjs';
import { ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface ConvexClientProviderProps {
  children: ReactNode;
}

/**
 * Convex Provider with Clerk Authentication
 * 
 * Replaces TanStack Query with Convex's real-time subscriptions.
 * Automatically syncs Clerk authentication with Convex.
 * 
 * Benefits:
 * - Real-time updates without polling
 * - Automatic cache invalidation
 * - Type-safe queries and mutations
 */
export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}


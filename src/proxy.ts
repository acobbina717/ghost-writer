import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Middleware for Ghost-Writer
 * 
 * Handles Clerk authentication only. Role-based authorization is handled
 * by page components querying Convex directly (single source of truth).
 * 
 * Routing logic:
 * - Unauthenticated users → redirect to login (/)
 * - Authenticated users → allowed to proceed, pages handle role checks
 */

const isPublicRoute = createRouteMatcher(['/', '/sign-up(.*)', '/api/webhooks(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api');

  // Unauthenticated users
  if (!userId) {
    if (isPublicRoute(request)) return NextResponse.next();
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Authenticated users on public routes → redirect to onboarding
  // (onboarding page will check Convex and redirect appropriately)
  if (isPublicRoute(request) && !isApiRoute) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // All other routes → allow through, pages handle role-based access
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};


import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { OnboardingForm } from './OnboardingForm';

export default async function OnboardingPage() {
  const { userId, getToken } = await auth();
  
  if (!userId) {
    redirect('/');
  }

  // Server-side check: If user already exists in Convex, redirect based on role
  // This prevents a flash of the onboarding form for existing users
  const token = await getToken({ template: "convex" }) ?? undefined;
  let existingUser = null;
  try {
    existingUser = await fetchQuery(
      api.users.getUserByClerkId,
      { clerkId: userId },
      { token },
    );
  } catch {
    // New user with no Convex record yet — fall through to show onboarding form
  }

  if (existingUser) {
    if (existingUser.role === 'pending') {
      redirect('/waiting-room');
    } else {
      redirect('/dashboard');
    }
  }

  // Get name from Clerk for new users
  const clerkUser = await currentUser();
  const userName = clerkUser?.username || clerkUser?.firstName || 'User';

  return <OnboardingForm userName={userName} />;
}

'use client';

import { SignIn, useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Center, Stack, Title, Text, Box, Loader } from '@mantine/core';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Don't render Clerk components until mounted (client-side)
  if (!mounted) {
    return (
      <Center h="100vh" bg="var(--bg-base)">
        <Loader size="lg" />
      </Center>
    );
  }

  return <HomePageContent />;
}

function HomePageContent() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Redirect to onboarding - that page will check DB and route appropriately
      router.push('/onboarding');
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <Center h="100vh" bg="var(--bg-base)">
        <Loader size="lg" />
      </Center>
    );
  }

  // If signed in, show loading while redirecting
  if (isSignedIn) {
    return (
      <Center h="100vh" bg="var(--bg-base)">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed" size="sm">Redirecting...</Text>
        </Stack>
      </Center>
    );
  }

  // Show login form for unauthenticated users
  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        position: 'relative',
      }}
    >
      <ColorSchemeToggle position="absolute" />
      <Stack align="center" gap="xl">
        <Stack align="center" gap="xs">
          <Title
            order={1}
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Ghost-Writer
          </Title>
          <Text c="dimmed" size="sm" style={{ letterSpacing: 'var(--ls-wider)', textTransform: 'uppercase' }}>
            Credit Repair Automation
          </Text>
        </Stack>
        
        <SignIn 
          appearance={{
            elements: {
              rootBox: {
                width: '100%',
                maxWidth: '400px',
              },
            },
          }}
          routing="hash"
          signUpUrl="/sign-up"
          forceRedirectUrl="/onboarding"
        />
      </Stack>
    </Box>
  );
}

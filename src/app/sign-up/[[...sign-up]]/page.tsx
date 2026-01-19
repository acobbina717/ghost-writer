'use client';

import { SignUp, useAuth } from '@clerk/nextjs';
import { Center, Stack, Title, Text, Box, Loader } from '@mantine/core';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle';

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();

  // Loading state: Clerk not ready yet
  // Or user is signed in (middleware will redirect them)
  if (!isLoaded || isSignedIn) {
    return (
      <Center h="100vh" bg="var(--bg-base)">
        <Loader color="red" size="lg" />
      </Center>
    );
  }

  // User is definitely not signed in — show signup form
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
            Join Ghost-Writer
          </Title>
          <Text c="dimmed" size="sm" style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Request Access
          </Text>
        </Stack>
        
        <SignUp 
          appearance={{
            elements: {
              rootBox: {
                width: '100%',
                maxWidth: '420px',
              },
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/"
        />

        <Text c="dimmed" size="xs" ta="center" maw={360}>
          After signing up, you&apos;ll need to complete your profile for verification.
        </Text>
      </Stack>
    </Box>
  );
}

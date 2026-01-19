'use client';

import { useClerk } from '@clerk/nextjs';
import { Text } from '@mantine/core';

export function SignOutLink() {
  const { signOut } = useClerk();
  return (

      <Text
        size="sm"
        c="red"
        style={{ cursor: 'pointer',}}
        onClick={() => signOut()}
      >
        Sign out 
      </Text>

  );
}


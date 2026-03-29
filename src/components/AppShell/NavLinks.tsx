'use client';

import { NavLink, Stack, Divider, Text, Badge } from '@mantine/core';
import {
  IconDashboard,
  IconUsers,
  IconFileText,
  IconAddressBook,
} from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface NavLinksProps {
  userRole: 'admin' | 'team' | 'pending';
  opened: boolean;
  toggleNavbar: () => void;
}

export function NavLinks({ userRole, opened, toggleNavbar }: NavLinksProps) {
  const pathname = usePathname();
  const isAdmin = userRole === 'admin';

  // Real-time pending user count from Convex
  const pendingCount = useQuery(
    api.users.getPendingUserCount,
    isAdmin ? {} : "skip"
  );

  return (
    <Stack gap="xs" p="md">
      {/* Main Navigation */}
      <NavLink
        component={Link}
        href="/dashboard"
        label="Dashboard"
        leftSection={<IconDashboard size={18} stroke={1.5} />}
        active={pathname === '/dashboard'}
        style={{
          borderRadius: 'var(--mantine-radius-sm)',
        }}
        onClick={opened ? toggleNavbar : undefined}
      />

      <NavLink
        component={Link}
        href="/clients"
        label="Clients"
        leftSection={<IconAddressBook size={18} stroke={1.5} />}
        active={pathname.startsWith('/clients')}
        style={{
          borderRadius: 'var(--mantine-radius-sm)',
        }}
        onClick={opened ? toggleNavbar : undefined}
      />

      {/* Admin Section */}
      {isAdmin && (
        <>
          <Divider my="xs" />
          <Text size="xs" c="dimmed" fw={500} tt="uppercase" px="sm" mb={4}>
            Admin
          </Text>
          
          <NavLink
            component={Link}
            href="/admin/users"
            label="User Management"
            leftSection={<IconUsers size={18} stroke={1.5} />}
            rightSection={
              pendingCount && pendingCount > 0 && (
                <Badge size="sm" variant="filled" circle>
                  {pendingCount}
                </Badge>
              )
            }
            active={pathname.startsWith('/admin/users')}
            style={{
              borderRadius: 'var(--mantine-radius-sm)',
            }}
            onClick={opened ? toggleNavbar : undefined}
          />
          
          <NavLink
            component={Link}
            href="/admin/letters"
            label="Letter Library"
            leftSection={<IconFileText size={18} stroke={1.5} />}
            active={pathname.startsWith('/admin/letters')}
            style={{
              borderRadius: 'var(--mantine-radius-sm)',
            }}
            onClick={opened ? toggleNavbar : undefined}
          />
        </>
      )}
    </Stack>
  );
}

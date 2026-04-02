'use client';

import { Group, Anchor, Text } from '@mantine/core';
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
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
  pendingCount?: number;
}

export function NavLinks({ userRole }: NavLinksProps) {
  const pathname = usePathname();
  const isAdmin = userRole === 'admin';

  // Real-time pending user count from Convex
  const pendingCount = useQuery(
    api.users.getPendingUserCount,
    isAdmin ? {} : "skip"
  );

  const items: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <IconDashboard size={16} stroke={1.5} />,
      isActive: (p) => p === '/dashboard',
    },
    {
      label: 'Clients',
      href: '/clients',
      icon: <IconAddressBook size={16} stroke={1.5} />,
      isActive: (p) => p.startsWith('/clients'),
    },
  ];

  if (isAdmin) {
    items.push(
      {
        label: 'Users',
        href: '/admin/users',
        icon: <IconUsers size={16} stroke={1.5} />,
        isActive: (p) => p.startsWith('/admin/users'),
        pendingCount: pendingCount && pendingCount > 0 ? pendingCount : undefined,
      },
      {
        label: 'Letter Library',
        href: '/admin/letters',
        icon: <IconFileText size={16} stroke={1.5} />,
        isActive: (p) => p.startsWith('/admin/letters'),
      }
    );
  }

  return (
    <Group gap="xs" h="100%">
      {items.map((item) => {
        const active = item.isActive(pathname);
        return (
          <Anchor
            key={item.href}
            component={Link}
            href={item.href}
            underline="never"
            h="100%"
            px="sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--mantine-font-size-sm)',
              fontWeight: 500,
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: active
                ? '2px solid var(--mantine-color-action-6)'
                : '2px solid transparent',
              transition: 'color 150ms ease, border-color 150ms ease',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              if (!active) {
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              if (!active) {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.pendingCount != null && (
              <Text
                component="span"
                size="sm"
                c="dimmed"
                fw={400}
              >
                ({item.pendingCount})
              </Text>
            )}
          </Anchor>
        );
      })}
    </Group>
  );
}

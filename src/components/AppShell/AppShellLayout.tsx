'use client';

import { AppShell, Burger, Group, Title, Text, Avatar, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconGhostFilled } from '@tabler/icons-react';
import { useUser, useClerk } from '@clerk/nextjs';
import { NavLinks } from './NavLinks';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle';

interface AppShellLayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'team' | 'pending';
}

/**
 * AppShellLayout - Main authenticated layout wrapper.
 * Uses Mantine's recommended pattern for hydration-safe color scheme toggle:
 * - useComputedColorScheme with getInitialValueInEffect: true
 * - CSS-based icon switching (both icons rendered, CSS shows correct one)
 */
export function AppShellLayout({ children, userRole }: AppShellLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap={8}>
              <IconGhostFilled size={24} style={{ color: 'var(--mantine-color-red-6)' }} />
              <Title order={3} style={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                Ghost-Writer
              </Title>
            </Group>
          </Group>

          <Group gap="md">
            <ColorSchemeToggle position="static" />

            {/* User menu */}
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <Group gap="xs" style={{ cursor: 'pointer' }}>
                  <Avatar
                    src={user?.imageUrl}
                    alt={user?.username || 'User'}
                    radius="xl"
                    size="sm"
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Text size="sm" fw={500} lh={1}>
                      {user?.username || 'User'}
                    </Text>
                    <Text size="xs" c="dimmed" lh={1} tt="uppercase">
                      {userRole}
                    </Text>
                  </div>
                  <IconChevronDown size={14} />
                </Group>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Account</Menu.Label>
                <Menu.Item onClick={() => signOut({ redirectUrl: '/' })} color="red">
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <NavLinks userRole={userRole} opened={opened} toggleNavbar={toggle} />
      </AppShell.Navbar>

      <AppShell.Main style={{ backgroundColor: 'var(--bg-base)' }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

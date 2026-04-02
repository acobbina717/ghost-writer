"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { UnstyledButton, Text, Stack, Group, Menu, Avatar, Box } from "@mantine/core";
import { spotlight } from "@mantine/spotlight";
import {
  IconDashboard,
  IconSearch,
  IconAddressBook,
  IconUser,
} from "@tabler/icons-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { LAYOUT, Z } from "@/theme/ghost-theme";

interface NavTab {
  label: string;
  icon: typeof IconDashboard;
  href?: string;
  action?: () => void;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();

  const tabs: NavTab[] = [
    { label: "Dashboard", icon: IconDashboard, href: "/dashboard" },
    { label: "Search", icon: IconSearch, action: () => spotlight.open() },
    { label: "Clients", icon: IconAddressBook, href: "/clients" },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <Box
      hiddenFrom="sm"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: LAYOUT.MOBILE_NAV_HEIGHT,
        backgroundColor: "var(--bg-surface)",
        borderTop: "1px solid var(--border-default)",
        zIndex: Z.MOBILE_NAV,
      }}
    >
      <Group h="100%" justify="space-around" align="center" wrap="nowrap" px="xs">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const color = active
            ? "var(--mantine-color-action-6)"
            : "var(--text-tertiary)";

          return (
            <UnstyledButton
              key={tab.label}
              onClick={() => {
                if (tab.action) {
                  tab.action();
                } else if (tab.href) {
                  router.push(tab.href);
                }
              }}
              style={{ flex: 1 }}
            >
              <Stack align="center" gap={2}>
                <tab.icon size={20} color={color} stroke={1.5} />
                <Text size="xxs" c={color} fw={active ? 600 : 400} lh={1}>
                  {tab.label}
                </Text>
              </Stack>
            </UnstyledButton>
          );
        })}

        {/* Profile tab with dropdown menu */}
        <Menu shadow="md" width={200} position="top-end">
          <Menu.Target>
            <UnstyledButton style={{ flex: 1 }}>
              <Stack align="center" gap={2}>
                {user?.imageUrl ? (
                  <Avatar
                    src={user.imageUrl}
                    alt={user?.username || "Profile"}
                    size={20}
                    radius="xl"
                  />
                ) : (
                  <IconUser
                    size={20}
                    color="var(--text-tertiary)"
                    stroke={1.5}
                  />
                )}
                <Text
                  size="xxs"
                  c="var(--text-tertiary)"
                  fw={400}
                  lh={1}
                >
                  Profile
                </Text>
              </Stack>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>
              {user?.username || user?.firstName || "Account"}
            </Menu.Label>
            <Menu.Item
              onClick={() => signOut({ redirectUrl: "/" })}
              color="red"
            >
              Sign Out
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Box>
  );
}

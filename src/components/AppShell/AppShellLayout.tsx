"use client";

import {
  AppShell,
  Group,
  Title,
  Text,
  Avatar,
  Menu,
  Box,
  Breadcrumbs,
  Anchor,
} from "@mantine/core";
import { IconChevronDown, IconGhostFilled } from "@tabler/icons-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NavLinks } from "./NavLinks";
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle";
import { SpotlightSearch, SearchTrigger } from "./SpotlightSearch";
import { MobileBottomNav } from "./MobileBottomNav";
import { LAYOUT, FW } from "@/theme/ghost-theme";

interface AppShellLayoutProps {
  children: React.ReactNode;
  userRole: "admin" | "team" | "pending";
}

/** Derive breadcrumb items from the current pathname. */
function useBreadcrumbs() {
  const pathname = usePathname();

  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    clients: "Clients",
    admin: "Admin",
    users: "User Management",
    letters: "Letter Library",
    new: "New Letter",
  };

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [];

  let path = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    path += `/${seg}`;
    const label = labelMap[seg];

    if (label) {
      const isLast = i === segments.length - 1;
      crumbs.push({ label, href: isLast ? undefined : path });
    } else {
      // Dynamic segment like [id] — label it contextually
      const prev = segments[i - 1];
      if (prev === "clients") {
        crumbs.push({ label: "Client Details" });
      } else {
        crumbs.push({ label: seg });
      }
    }
  }

  return crumbs;
}

/**
 * AppShellLayout - Main authenticated layout wrapper.
 * Dual-layer horizontal header:
 *   Layer 1 (60px): Logo, omni-search, theme toggle, profile menu
 *   Layer 2 (48px): Breadcrumbs (left), horizontal nav links (right)
 */
export function AppShellLayout({ children, userRole }: AppShellLayoutProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const breadcrumbs = useBreadcrumbs();

  return (
    <>
      <SpotlightSearch userRole={userRole} />
      <AppShell header={{ height: LAYOUT.HEADER_TOTAL }} padding="md">
        <AppShell.Header>
          {/* === Layer 1: Command Header (60px) === */}
          <Group
            h={LAYOUT.HEADER_LAYER1}
            px="md"
            justify="space-between"
            wrap="nowrap"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderBottom: "1px solid var(--border-default)",
              position: "relative",
            }}
          >
            {/* Left: Logo */}
            <Anchor component={Link} href="/dashboard" underline="never" c="inherit" style={{ flexShrink: 0 }}>
            <Group gap="sm" style={{ cursor: "pointer" }}>
              <IconGhostFilled
                size={24}
                style={{ color: "var(--mantine-color-red-6)" }}
              />
              <Title
                order={3}
                style={{ fontWeight: 900, letterSpacing: "var(--ls-tight)" }}
                visibleFrom="xs"
              >
                Ghost-Writer
              </Title>
            </Group>
            </Anchor>

            {/* Omni-Search (Perfectly Centered) */}
            <Box
              visibleFrom="sm"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1,
                width: "100%",
                maxWidth: 600,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box w="100%" px="xl">
                <SearchTrigger />
              </Box>
            </Box>

            {/* Right: Theme Toggle + Profile Menu */}
            <Group gap="md" style={{ flexShrink: 0 }}>
              <ColorSchemeToggle position="static" />

              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <Group gap="xs" style={{ cursor: "pointer" }}>
                    <Avatar
                      src={user?.imageUrl}
                      alt={user?.username || "User"}
                      radius="xl"
                      size="sm"
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <Text size="sm" fw={FW.HEADING} lh={1}>
                        {user?.username || "User"}
                      </Text>
                      <Text size="xxs" c="dimmed" lh={1} tt="uppercase" fw={FW.LABEL} style={{ letterSpacing: 'var(--ls-wide)' }}>
                        {userRole}
                      </Text>
                    </div>
                    <IconChevronDown size={14} />
                  </Group>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Account</Menu.Label>
                  <Menu.Item
                    onClick={() => signOut({ redirectUrl: "/" })}
                    color="red"
                  >
                    Sign Out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>

          {/* === Layer 2: Context Ribbon (48px) === */}
          <Group
            h={LAYOUT.HEADER_LAYER2}
            px="md"
            justify="space-between"
            style={{
              backgroundColor: "var(--bg-base)",
              borderBottom: "1px solid var(--border-default)",
            }}
          >
            {/* Left: Breadcrumbs */}
            <Breadcrumbs
              separator="/"
              styles={{
                separator: { color: "var(--text-muted)", marginInline: 8 },
              }}
            >
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                if (isLast || !crumb.href) {
                  return (
                    <Text key={`${index}-${crumb.label}`} size="sm" c="dimmed">
                      {crumb.label}
                    </Text>
                  );
                }
                return (
                  <Anchor
                    key={`${index}-${crumb.label}`}
                    component={Link}
                    href={crumb.href}
                    size="sm"
                    c="dimmed"
                  >
                    {crumb.label}
                  </Anchor>
                );
              })}
            </Breadcrumbs>

            {/* Right: Horizontal Nav Links (hidden on mobile) */}
            <Box visibleFrom="sm" h="100%">
              <NavLinks userRole={userRole} />
            </Box>
          </Group>
        </AppShell.Header>

        <AppShell.Main
          style={{ backgroundColor: "var(--bg-base)" }}
          pb={{ base: LAYOUT.MOBILE_NAV_HEIGHT + 16, sm: "md" }}
        >
          {children}
        </AppShell.Main>
      </AppShell>
      <MobileBottomNav />
    </>
  );
}

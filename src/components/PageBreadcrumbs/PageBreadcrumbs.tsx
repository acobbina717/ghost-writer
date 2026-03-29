'use client';

import { Breadcrumbs, Anchor, Text } from '@mantine/core';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * PageBreadcrumbs - Consistent breadcrumb navigation for deep page flows.
 * Last item renders as plain text (current page), all others as links.
 */
export function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  return (
    <Breadcrumbs
      separator="/"
      styles={{
        separator: { color: 'var(--text-muted)', marginInline: 8 },
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.href) {
          return (
            <Text key={`${index}-${item.label}`} size="sm" c="dimmed">
              {item.label}
            </Text>
          );
        }

        return (
          <Anchor key={`${index}-${item.label}`} component={Link} href={item.href} size="sm" c="dimmed">
            {item.label}
          </Anchor>
        );
      })}
    </Breadcrumbs>
  );
}

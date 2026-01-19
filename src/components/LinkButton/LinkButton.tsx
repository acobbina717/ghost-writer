'use client';

import Link from 'next/link';
import { Button, ButtonProps } from '@mantine/core';

interface LinkButtonProps extends Omit<ButtonProps, 'component'> {
  href: string;
}

/**
 * A Button that navigates using Next.js Link.
 * Use this instead of `<Button component={Link}>` in Server Components.
 */
export function LinkButton({ href, children, ...props }: LinkButtonProps) {
  return (
    <Button component={Link} href={href} {...props}>
      {children}
    </Button>
  );
}


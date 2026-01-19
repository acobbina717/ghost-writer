import { IconBrandTelegram, IconBrandDiscord, IconBrandInstagram } from '@tabler/icons-react';

/**
 * Get the appropriate social platform icon component.
 * Platforms are fixed per FUNCTIONAL_SPECIFICATION.md §2.1:
 * 'telegram' | 'discord' | 'instagram'
 */
export function getSocialIcon(platform: string, size = 16) {
  switch (platform.toLowerCase()) {
    case 'telegram':
      return <IconBrandTelegram size={size} />;
    case 'discord':
      return <IconBrandDiscord size={size} />;
    case 'instagram':
      return <IconBrandInstagram size={size} />;
    default:
      return null;
  }
}

/**
 * Format a date using Intl.DateTimeFormat with sensible defaults.
 * Uses manual formatting when time is included to avoid hydration mismatches
 * caused by different locale separators on server vs client.
 * 
 * @param date - The date to format
 * @param options - Optional Intl.DateTimeFormatOptions to override defaults
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  const d = new Date(date);
  
  // If time options are included, format manually to avoid locale inconsistencies
  if (options?.hour || options?.minute) {
    const dateStr = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
    
    const timeStr = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
    
    return `${dateStr}, ${timeStr}`;
  }
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(d);
}


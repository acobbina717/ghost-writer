import { formatAddress } from './formatAddress';

/**
 * Hydration data combining client, dispute, and form data
 */
export interface HydrationData {
  // Client data
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  last4SSN: string;
  
  // Dispute data
  disputeType: string;
  creditorName?: string | null;
  accountNumber?: string | null;
  currentRound: number;
  
  // Dynamic form answers
  formAnswers?: Record<string, any>;
}

/**
 * Replace all {{tag}} instances in HTML template with actual values
 * Supports global tags, dispute tags, and dynamic form tags
 */
export function hydrateTemplate(template: string, data: HydrationData): string {
  // Build tag replacement map
  const replacements: Record<string, string> = {
    // Global client tags
    client_name: `${data.firstName} ${data.lastName}`,
    first_name: data.firstName,
    last_name: data.lastName,
    client_address: formatAddress(data),
    last_4_ssn: `XXX-XX-${data.last4SSN}`,
    
    // Dispute tags
    dispute_type: data.disputeType,
    creditor_name: data.creditorName || '',
    account_number: data.accountNumber || '',
    current_round: String(data.currentRound),
    
    // System tags
    current_date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    
    // Include all form answers
    ...(data.formAnswers || {}),
  };

  // Replace all tags in template
  let hydrated = template;
  for (const [tag, value] of Object.entries(replacements)) {
    // Match {{tag}} with optional whitespace
    const regex = new RegExp(`\\{\\{\\s*${tag}\\s*\\}\\}`, 'g');
    hydrated = hydrated.replace(regex, String(value));
  }

  return hydrated;
}

/**
 * Extract all {{tag}} references from a template
 * Useful for validation and debugging
 */
export function extractTags(template: string): string[] {
  const tagRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const tags: string[] = [];
  let match;
  
  while ((match = tagRegex.exec(template)) !== null) {
    if (!tags.includes(match[1])) {
      tags.push(match[1]);
    }
  }
  
  return tags;
}

/**
 * Check if a template has unresolved tags after hydration
 * Returns array of unresolved tag names
 */
export function findUnresolvedTags(hydratedHtml: string): string[] {
  return extractTags(hydratedHtml);
}

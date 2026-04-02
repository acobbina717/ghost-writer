import { formatAddress } from './formatAddress';
import { getSchemaGroupForType } from '../../convex/constants';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A single dispute item for hydration — all fields optional,
 * populated based on the dispute type's schema group.
 */
export interface DisputeItemData {
  creditorName?: string | null;
  accountNumber?: string | null;
  inquiryDate?: string | null;
  dateOpened?: string | null;
  balance?: string | null;
  monthsLate?: string | null;
  monthLate?: string | null;
}

/**
 * Hydration data combining client and dispute data.
 * No more formAnswers, clientInfoFields, or currentRound.
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
  email?: string;
  phone?: string;
  dateOfBirth?: string | null;

  // Dispute context
  disputeType: string;

  // Multiple dispute items for the repeating block
  disputeItems?: DisputeItemData[];
}

/**
 * Valid client info field keys for backward-compat {{client_info_block}} tag.
 * Keep during transition period — new templates use individual tags.
 */
export const CLIENT_INFO_FIELD_OPTIONS = [
  { value: 'name', label: 'Full Name' },
  { value: 'ssn', label: 'Social Security Number' },
  { value: 'dob', label: 'Date of Birth' },
  { value: 'address', label: 'Mailing Address' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
] as const;

// =============================================================================
// VALIDATION
// =============================================================================

const REQUIRED_CLIENT_FIELDS: (keyof HydrationData)[] = [
  'firstName', 'lastName', 'address1', 'city', 'state', 'zipCode', 'last4SSN',
];

/**
 * Validate hydration data before rendering.
 * Throws a descriptive error if any required field is missing so the caller
 * can surface it to the user instead of silently generating a blank PDF.
 */
function validateHydrationData(data: HydrationData): void {
  // Check required client-level fields
  for (const field of REQUIRED_CLIENT_FIELDS) {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new Error(`Missing required client field: ${field}`);
    }
  }

  // Check required dispute item fields per schema group
  if (data.disputeItems && data.disputeItems.length > 0) {
    const schema = getSchemaGroupForType(data.disputeType);
    if (schema) {
      const requiredKeys = schema.fields.filter(f => f.required).map(f => f.key);
      data.disputeItems.forEach((item, index) => {
        for (const key of requiredKeys) {
          const value = item[key as keyof DisputeItemData];
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            throw new Error(
              `Item ${index + 1} is missing required field "${key}" for dispute type "${data.disputeType}"`
            );
          }
        }
      });
    }
  }
}

// =============================================================================
// PASS 1: Expand the repeating dispute block
// =============================================================================

const BLOCK_START = '<!--dispute_block_start-->';
const BLOCK_END = '<!--dispute_block_end-->';

/**
 * Per-item tag replacement map for a single dispute item.
 */
function buildItemReplacements(item: DisputeItemData, index: number): Record<string, string> {
  return {
    item_number: String(index + 1),
    item_creditor_name: item.creditorName || '',
    item_account_number: item.accountNumber || '',
    item_inquiry_date: item.inquiryDate || '',
    item_date_opened: item.dateOpened || '',
    item_balance: item.balance || '',
    item_months_late: item.monthsLate || '',
    item_month_late: item.monthLate || '',
  };
}

/**
 * Replace per-item tags within a block HTML string.
 */
function hydrateItemBlock(blockHtml: string, replacements: Record<string, string>): string {
  let result = blockHtml;
  for (const [tag, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\{\\{\\s*${escapeRegex(tag)}\\s*\\}\\}`, 'g');
    result = result.replace(regex, escapeHtml(value));
  }
  return result;
}

/**
 * Pass 1: Find <!--dispute_block_start-->...<!--dispute_block_end--> markers,
 * expand the content for each dispute item, and replace the marker region.
 */
function expandDisputeBlock(template: string, items?: DisputeItemData[]): string {
  const startIdx = template.indexOf(BLOCK_START);
  const endIdx = template.indexOf(BLOCK_END);

  // No markers found — skip expansion
  if (startIdx === -1 || endIdx === -1) return template;

  const blockContent = template.substring(startIdx + BLOCK_START.length, endIdx);
  const before = template.substring(0, startIdx);
  const after = template.substring(endIdx + BLOCK_END.length);

  // Markers found but no items — remove the entire region
  if (!items || items.length === 0) {
    return before + after;
  }

  // Expand the block for each item
  const expandedBlocks = items.map((item, index) => {
    const replacements = buildItemReplacements(item, index);
    return hydrateItemBlock(blockContent, replacements);
  });

  return before + expandedBlocks.join('\n') + after;
}

// =============================================================================
// PASS 2: Replace global tags
// =============================================================================

/**
 * Replace all {{tag}} instances in HTML template with actual values.
 * Two-pass process: 1) expand dispute block, 2) replace global tags.
 */
export function hydrateTemplate(template: string, data: HydrationData): string {
  // Validate required fields before rendering — throws with a clear message
  // rather than silently producing a blank PDF.
  validateHydrationData(data);

  // Pass 1: Expand the repeating block
  let hydrated = expandDisputeBlock(template, data.disputeItems);

  // Pass 2: Build global tag replacement map
  const replacements: Record<string, string> = {
    // Individual client info tags
    client_name: `${data.firstName} ${data.lastName}`,
    first_name: data.firstName,
    last_name: data.lastName,
    client_address: formatAddress(data),
    client_ssn: `XXX-XX-${data.last4SSN}`,
    client_dob: data.dateOfBirth || '',
    client_email: data.email || '',
    client_phone: data.phone || '',

    // Legacy aliases (backward compatibility)
    last_4_ssn: `XXX-XX-${data.last4SSN}`,

    // System tags
    current_date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };

  // Replace all tags
  for (const [tag, value] of Object.entries(replacements)) {
    const regex = new RegExp(`\\{\\{\\s*${escapeRegex(tag)}\\s*\\}\\}`, 'g');
    hydrated = hydrated.replace(regex, escapeHtml(String(value)));
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

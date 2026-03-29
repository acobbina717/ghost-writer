/**
 * Shared constants used by both Convex backend and frontend.
 * This is the single source of truth — do not duplicate these values elsewhere.
 */

// =============================================================================
// DISPUTE TYPES
// =============================================================================

export const DISPUTE_TYPES = [
  'Late Payment',
  'Medical',
  'Collection',
  'Charge-off',
  'Repossession',
  'Foreclosure',
  'Bankruptcy',
  'Inquiry',
  'Early Warning',
  'ChexSystems',
] as const;

export type DisputeType = (typeof DISPUTE_TYPES)[number];

// =============================================================================
// CREDIT REPORTING AGENCIES
// =============================================================================

export const VALID_CRA_TARGETS = [
  'experian',
  'equifax',
  'transunion',
  'lexisnexis',
  'chexsystems',
  'earlywarning',
] as const;

export type CRATarget = (typeof VALID_CRA_TARGETS)[number];

/**
 * Default CRAs applicable to most dispute types.
 * Only exceptions need to be listed in DISPUTE_TYPE_CRA_OVERRIDES.
 */
const DEFAULT_CRAS: string[] = ['equifax', 'experian', 'transunion'];

/**
 * Overrides for dispute types that use non-default CRAs.
 * Any type NOT listed here uses DEFAULT_CRAS.
 */
const DISPUTE_TYPE_CRA_OVERRIDES: Partial<Record<DisputeType, string[]>> = {
  'Early Warning': ['earlywarning'],
  'ChexSystems': ['chexsystems'],
};

/** Get the applicable CRAs for a given dispute type */
export function getCrasForDisputeType(disputeType: string): string[] {
  return DISPUTE_TYPE_CRA_OVERRIDES[disputeType as DisputeType] ?? DEFAULT_CRAS;
}

// =============================================================================
// SOCIAL PLATFORMS (Onboarding)
// =============================================================================

export const SOCIAL_PLATFORMS = [
  { value: 'telegram', label: 'Telegram' },
  { value: 'discord', label: 'Discord' },
  { value: 'instagram', label: 'Instagram' },
] as const;

export const VALID_SOCIAL_PLATFORM_VALUES = SOCIAL_PLATFORMS.map(p => p.value);

// =============================================================================
// US STATES
// =============================================================================

export const VALID_US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
] as const;

// =============================================================================
// PII PURGE THRESHOLDS
// =============================================================================

export const PURGE_WARNING_DAYS = 80;
export const PURGE_DANGER_DAYS = 85;

// =============================================================================
// CLIENT INFO FIELD KEYS (validated server-side)
// Keep for backward compatibility during transition period
// =============================================================================

export const VALID_CLIENT_INFO_FIELD_KEYS = [
  'name', 'ssn', 'dob', 'address', 'email', 'phone', 'date',
] as const;

// =============================================================================
// DISPUTE ITEM SCHEMA GROUPS
// =============================================================================
// Three schema groups define which fields a dispute item can have.
// This single definition drives: editor sidebar tags, mutation validation,
// generation form fields, and multi-type enforcement.

export interface DisputeItemFieldDef {
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
  type?: 'text' | 'select';
  options?: string[];
}

export interface DisputeItemSchema {
  group: string;
  types: string[];
  fields: DisputeItemFieldDef[];
}

export const DISPUTE_ITEM_SCHEMAS: DisputeItemSchema[] = [
  {
    group: 'inquiry',
    types: ['Inquiry'],
    fields: [
      { key: 'creditorName', label: 'Company/Furnisher Name', required: true },
      { key: 'inquiryDate', label: 'Date of Inquiry', required: true, placeholder: '01/15/2025' },
    ],
  },
  {
    group: 'late_payment',
    types: ['Late Payment'],
    fields: [
      { key: 'creditorName', label: 'Account/Furnisher Name', required: true },
      { key: 'monthsLate', label: 'Months Late', required: true, type: 'select', options: ['30', '60', '90', '120'] },
      { key: 'monthLate', label: 'Month Late', required: true, placeholder: '03/2022' },
    ],
  },
  {
    group: 'account_based',
    types: ['Collection', 'Charge-off', 'Repossession', 'Foreclosure', 'Medical', 'Bankruptcy'],
    fields: [
      { key: 'creditorName', label: 'Account/Furnisher Name', required: true },
      { key: 'accountNumber', label: 'Account Number', required: false },
      { key: 'dateOpened', label: 'Date Opened', required: false },
      { key: 'balance', label: 'Balance', required: false },
    ],
  },
];

/** Get the schema group for a dispute type */
export function getSchemaGroupForType(disputeType: string): DisputeItemSchema | undefined {
  return DISPUTE_ITEM_SCHEMAS.find(s => s.types.includes(disputeType));
}

/** Get the schema group name for a dispute type */
export function getSchemaGroupName(disputeType: string): string | undefined {
  return getSchemaGroupForType(disputeType)?.group;
}

/** Check if multiple dispute types belong to the same schema group */
export function areTypesCompatible(types: string[]): boolean {
  if (types.length <= 1) return true;
  const groups = new Set(types.map(t => getSchemaGroupName(t)));
  return groups.size === 1 && !groups.has(undefined);
}

/** Get all valid field keys for a schema group */
export function getValidFieldKeys(disputeType: string): string[] {
  const schema = getSchemaGroupForType(disputeType);
  return schema ? schema.fields.map(f => f.key) : [];
}

// =============================================================================
// LETTER CSS (shared between PDF generation and editor preview)
// =============================================================================

export const LETTER_CSS = `
  body {
    font-family: Arial, sans-serif;
    font-size: 12pt;
    padding: 1in;
    margin: 0;
  }
  p { margin: 0; }
  h1, h2, h3 { margin: 0; }
`;

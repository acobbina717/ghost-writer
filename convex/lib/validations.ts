/**
 * Shared validation — single source of truth for client field regexes.
 * Imported by both the Convex backend (throws on invalid) and the
 * Next.js frontend (returns error strings for Mantine form validators).
 */

export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

export const PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;

export const ZIP_REGEX = /^\d{5}$/;

export const SSN_REGEX = /^\d{4}$/;

/** Expects MM/DD/YYYY — the canonical backend date format. */
export const DOB_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

export const isValidEmail = (v: string) => EMAIL_REGEX.test(v);
export const isValidPhone = (v: string) => PHONE_REGEX.test(v);
export const isValidZip   = (v: string) => ZIP_REGEX.test(v);
export const isValidSSN   = (v: string) => SSN_REGEX.test(v);
export const isValidDOB   = (v: string) => DOB_REGEX.test(v);

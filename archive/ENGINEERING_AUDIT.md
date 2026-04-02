# Engineering Team Audit Report

**Date**: 2026-03-21
**Project**: Ghost-Writer (Next.js 16 + Convex + Clerk + Mantine)
**Agents**: Software Architect, Frontend Developer, Code Reviewer, Security Engineer, Database Optimizer
**Remediation completed**: 2026-03-21

---

## Consolidated Priority Fixes

| Priority | Issue | Flagged By | Status |
|----------|-------|------------|--------|
| **P0** | Regex HTML sanitizer - use DOMPurify (SSXSS risk) | Security, DB Optimizer, Architect | FIXED - `convex/pdf.ts` now uses `isomorphic-dompurify` with allowlisted tags/attrs |
| **P0** | Unauthenticated Convex queries exposing user data | Security, Architect | FIXED - `getUser`, `getPendingUserCount`, `getUserByClerkId` now require auth |
| **P0** | React Rules of Hooks violation (conditional `useQuery`) | Architect | FIXED - Both files use `useQuery(api, letterId ? args : "skip")` pattern |
| **P1** | PII in URL query parameters | Security, Architect | FIXED - Form data moved to `sessionStorage`, cleaned up after PDF download |
| **P1** | HTML injection via template hydration (no escaping) | Security | FIXED - `hydrateTemplate.ts` now HTML-escapes all values + regex-escapes tag names |
| **P1** | No loading state / double-submit on dispute creation | Frontend, Code Reviewer | FIXED - `isSubmitting` state disables button, shows loading, prevents modal close |
| **P1** | CRA constants desync across 3 files | Frontend, Code Reviewer, Architect | FIXED - All 6 CRAs in centralized `CRA_LABELS`; `dispute-constants.ts` derives from it |
| **P1** | No server-side input validation on mutations | Security, DB Optimizer, Architect | FIXED - Validation for SSN, ZIP, state, email, phone, disputeType, craTarget, socialPlatform |
| **P2** | N+1 queries and full table scans in analytics | DB Optimizer, Architect | FIXED - Added `by_role`, `by_status`, `by_created_at` indexes; analytics use indexed queries |
| **P2** | Missing `sandbox` on preview iframe | Security | FIXED - Added `sandbox=""` to preview iframe |
| **P2** | `v.any()` for schema-less fields | Security, DB Optimizer | FIXED - `formSchema`, `formAnswers`, `metadata` now have typed validators |
| **P2** | Security headers missing in `next.config.ts` | Security | FIXED - Added HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **P3** | Zero test coverage | Architect | OPEN - Planned for next sprint |
| **P3** | Manual types instead of Convex-generated types | DB Optimizer, Architect | FIXED - `convex-types.ts` now uses `Doc<"tableName">` from generated data model |
| **P3** | Index-based keys on dynamic lists | Frontend, Code Reviewer | FIXED - `DisputeItem` has `id` field; keys use `item.id` via `crypto.randomUUID()` |

---

## Architecture Review (Software Architect)

### Strengths

- **Coherent technology stack**: Convex + Clerk + Mantine + Next.js 16 is well-matched for an internal credit dispute tool. Convex provides real-time subscriptions, Clerk handles auth with zero custom backend code, Mantine provides comprehensive UI components.
- **Defense-in-depth auth**: Edge middleware (`src/proxy.ts`) gates routes, `(authenticated)/layout.tsx` enforces user record existence and role, every Convex function calls `requireAuth()` independently.
- **Well-designed design system**: `colors.ts` -> `ghost-theme.ts` -> `variables.css` three-layer approach provides color tokens accessible from both JS and CSS. Clerk appearance object consumes the same tokens.
- **Smart real-time usage**: `StatusPoller` subscribes to the current user via `useQuery` and detects role changes instantly (e.g., admin approval redirects from waiting room without polling).
- **Thoughtful domain modeling**: Audit log table with denormalized email, separation of `disputeItems` from `generationLogs`, and the template hydration system (`{{smart_tags}}`).

### Critical Issues

**B1. React Rules of Hooks Violation**
- Files: `src/app/(authenticated)/clients/[id]/generate/[disputeId]/page.tsx:28`, `preview/page.tsx:38`
- `letterId ? useQuery(...) : undefined` violates React's rules of hooks
- Fix: `useQuery(api.letters.getLetter, letterId ? { id: letterId } : "skip")`

**B2. PII in URL Query Parameters**
- File: `src/app/(authenticated)/clients/[id]/generate/[disputeId]/page.tsx:66-70`
- Form data serialized as JSON in the URL, recorded in browser history, server logs, Sentry breadcrumbs
- Fix: Replace with sessionStorage, React context, or a Zustand store

**B3. Duplicate CRA Definitions**
- `src/lib/constants.ts` defines 3 CRAs
- `src/app/(authenticated)/clients/[id]/dispute-constants.ts` defines 6 CRAs
- `convex/schema.ts` has unvalidated `v.array(v.string())` for `applicableCRAs`
- Fix: Consolidate to a single CRA registry

### Significant Concerns

- Full table scans in analytics queries (`getLetterAnalytics`, `getLetterStats`)
- Manual type definitions in `src/lib/convex-types.ts` instead of Convex-generated `Doc<>` types
- Inconsistent audit logging (some files use `createAuditLog` helper, others inline)
- No server-side input validation on mutations
- Unguarded backend queries (`getUser`, `getPendingUserCount`, `getUserByClerkId`)

### Improvement Opportunities

- Zero test coverage (risky for PII-handling app)
- Replace regex HTML sanitizer with DOMPurify
- Add pagination (all queries use `.collect()`)
- Add `by_role` index to users table
- Add route-level error boundaries
- Extract shared modals to `src/components/`
- Add `@convex/*` path alias to avoid deep relative imports

### Architecture Decision Summary

| Decision | Assessment | Risk |
|----------|------------|------|
| Convex over traditional DB | Good - real-time eliminates polling | Lock-in to Convex pricing/limits |
| Client-side auth + server enforcement | Good - defense in depth | None |
| App Router route groups for auth | Good - clean layout composition | None |
| `v.any()` for formSchema/formAnswers | Risky - no runtime validation | Data corruption over time |
| Manual CSS variable duplication | Acceptable now | Drift risk as palette evolves |
| No testing | Risky for PII application | Regression bugs in auth/template logic |
| Full table scans for analytics | Acceptable now | Performance wall at ~1000+ records |

---

## Frontend Review (Frontend Developer)

### Must Fix

**1. CRA Constants Desynchronized from Global Constants**
- `dispute-constants.ts:14-21` introduces 6 CRAs; `src/lib/constants.ts:55-59` only knows 3
- When a dispute uses `craTarget: 'chexsystems'`, the disputes table shows raw string instead of labeled badge
- Fix: Update `CRA_LABELS` in `src/lib/constants.ts` to include all 6 CRAs

**2. Missing Loading/Submitting State on "Create Disputes" Button**
- `DisputeItemModal.tsx:106-155` fires sequential `await createDisputeItem()` calls with no loading state
- Double-click creates duplicate records
- Fix: Add `submitting` state, pass `loading={submitting}` and `disabled={submitting}` to button

**3. Non-Atomic Batch Submission Can Partially Fail**
- `DisputeItemModal.tsx:119-137` loops over CRAs calling mutations one at a time
- If call 3 fails after 2 succeeded, user has no way to know which items were created
- Fix: Create batch mutation `createDisputeItems` for all-or-nothing, or track which items succeeded

### Should Fix

**4. No Validation Feedback When Clicking "Next"**
- `DisputeItemModal.tsx:48-57` disables Next button but shows no message explaining why
- `validateCraStep` returns human-readable errors that are never displayed

**5. Missing `aria-label` on Delete ActionIcon**
- `CraCustomizationStep.tsx:45-53` delete button has no aria-label for screen readers

**6. Missing Table Captions in Review Step**
- `ReviewStep.tsx:54-69` tables have no `aria-label` or `<caption>` identifying which CRA

**7. `key={index}` on CRA Item Cards**
- `CraCustomizationStep.tsx:31` uses array index as key on a list with add/remove operations
- Fix: Generate stable unique ID (e.g., `crypto.randomUUID()`) for each item

**8. Modal Does Not Prevent Close During Submission**
- `DisputeItemModal.tsx:163-168` allows closing via Escape/click-outside during submission
- Fix: Set `closeOnClickOutside={false}` and `closeOnEscape={false}` when submitting

**9. Orphaned `craItems` on CRA Deselection**
- When user deselects a CRA from MultiSelect, items remain in form state
- Stale data reappears if CRA is re-selected

### Should Consider

- Server-side validation of disputeType and craTarget values
- Derive `DisputeType` union type from the `as const` array
- Use value/label pairs for `DISPUTE_TYPES` for forward compatibility
- Magic number `mt={25}` for button alignment is fragile
- Add "jump to step" capability from Review step
- Batch mutation for atomic all-or-nothing submission

---

## Code Quality Review (Code Reviewer)

### Critical

**1. Sequential Mutations with No Batching or Loading State**
- `DisputeItemModal.tsx:122-137` fires one mutation per item in a sequential loop
- Partial failure leaves data inconsistent; no loading/disabled state on submit button

### Warnings

**2. Duplicated CRA Constants**
- `dispute-constants.ts` introduces parallel `CRA_OPTIONS` and `getCraLabel()` that diverge from `src/lib/constants.ts`

**3. Loose `string` Types Where Union Types Would Provide Safety**
- `dispute-types.ts:8-12` uses `string` for `disputeType` and `string[]` for `craTargets`
- `DISPUTE_TYPES` is `as const` but the precision is discarded by the form types

**4. Unstable `key={index}` on Dynamic List Items**
- `CraCustomizationStep.tsx:31` and `ReviewStep.tsx:62` use index keys on removable lists

**5. `totalSteps` Referenced Before Definition**
- `DisputeItemModal.tsx:53,86` reference `totalSteps` defined on line 94 (works at runtime but poor readability)

**6. No `isSubmitting` State**
- `DisputeItemModal.tsx:106-155` has no mechanism to prevent double-submit

**7. Display Strings Used as Data Values**
- `DISPUTE_TYPES` values like `"Late Payment"` are stored directly; renaming labels breaks backward compatibility

### Info

- `DISPUTE_TYPE_TO_CRAS` key type not connected to `DISPUTE_TYPES` (no exhaustiveness checking)
- NavLinks mobile close behavior is clean and well-done
- Missing `'use client'` in sub-components is acceptable (propagated from parent)
- Fixed `ScrollArea h={350}` may not adapt to small viewports

### Positive Notes

- Step decomposition is well-structured with clear separation of concerns
- `DisputeFormType` alias avoids repeating generic parameters
- Validation logic (`validateCraStep`, `isCurrentStepValid`) is clean and readable
- `ensureCraItemsInitialized` avoids unnecessary re-renders
- Error handling follows established project patterns

---

## Security Audit (Security Engineer)

### Critical

**1. Regex-Based HTML Sanitizer is Bypassable (SSXSS to PDF)**
- `convex/pdf.ts:14-24` uses regex-based sanitization before feeding HTML to headless Chrome
- Bypass vectors: `<img src=x onerror=...>`, `<svg onload=...>`, mixed case, HTML entities
- `isomorphic-dompurify` is in `package.json` but never used
- Fix: Replace regex with DOMPurify using an allowlist of tags/attributes

**2. Unauthenticated Convex Queries Expose User Data**
- `getUser` (users.ts:29-34): Returns full user record with no auth
- `getPendingUserCount` (users.ts:39-47): Returns count with no auth
- `getUserByClerkId` (users.ts:87-95): Returns full user by Clerk ID with no auth
- Impact: Public Convex URL allows enumeration of users, emails, roles, social handles

### High

**3. Template Hydration Allows HTML Injection**
- `hydrateTemplate.ts:55-63` inserts form answer values into HTML with zero escaping
- Injected content reaches preview iframe and Browserless PDF generator
- Fix: HTML-escape all replacement values before insertion

**4. PII Exposed in URL Query Parameters**
- `generate/[disputeId]/page.tsx:66-70` serializes form data as JSON in query strings
- Visible in browser history, server logs, Sentry, Referer headers
- Fix: Use sessionStorage or React state/context

**5. Missing Semantic Input Validation on Convex Mutations**
- `createClient`/`updateClient`: `last4SSN`, `zipCode`, `email`, `state`, `phone` accept any string
- `createDisputeItem`: `disputeType` and `craTarget` unvalidated
- `completeOnboarding`: `socialPlatform` unvalidated
- Fix: Add format validation in mutation handlers

**6. `logGeneration` Lacks Row-Level Authorization**
- `letters.ts:285-322` does not verify the authenticated user owns the referenced client
- Any team member can log generations against another member's clients

### Medium

**7. `v.any()` Used for Schema-Less Data Storage**
- `formSchema`, `formAnswers`, `metadata` fields bypass all type validation
- Fix: Define explicit validators for form field structure

**8. Sentry Session Replay May Capture PII**
- `replaysOnErrorSampleRate: 1.0` and `tracesSampleRate: 1` send everything
- URLs with PII query params are captured
- Fix: Reduce sample rates, add `beforeSendTransaction` to strip PII

**9. Error Messages Expose Internal Details**
- `error.tsx:30`, `preview/page.tsx:128-129`, `ClientFormModal.tsx:158` display `error.message` directly
- Fix: Show generic messages, log details to Sentry

**10. Admin Self-Demotion Not Prevented**
- `demoteUser` and `denyUser` do not prevent targeting own account
- Could leave system with zero admins

**11. Missing `sandbox` on Preview Iframe**
- `preview/page.tsx:186-213` uses `srcDoc` with no `sandbox` attribute
- Fix: Add `sandbox=""` for defense-in-depth

**12. Missing Security Headers**
- `next.config.ts` does not set CSP, HSTS, X-Frame-Options, etc.
- Fix: Add headers via `async headers()` in Next.js config

### Low

- Stale Neon Postgres references in `.env.example`
- `console.error` in production code leaks implementation details
- Regex injection in template hydration (`hydrateTemplate.ts:62`)

### Positive Security Observations

- Consistent `requireAuth` usage across most Convex functions
- Row-level security on client queries verifies ownership
- Audit logging on all state-changing operations
- Clerk + Convex JWT integration is sound
- SSN minimization (last 4 only)
- PasteSanitizer on Tiptap editor
- `.env` files in `.gitignore`
- Generic global error page

---

## Database Review (Database Optimizer)

### Critical

**1. N+1 in `getClientsWithDisputes`**
- `convex/clients.ts:50-68` executes N queries for N clients
- 50 clients = 51 DB round trips; each tracked separately by Convex reactivity
- Fix: Denormalize dispute counts onto the `clients` table

**2. N+1 in `getClientStats`**
- `convex/clients.ts:140-152` identical pattern, unbounded for admin views

**3. Triple Full-Table Scan in `getLetterAnalytics`**
- `convex/letters.ts:47-49` loads ALL rows from `letters`, `generationLogs`, `disputeItems`
- In-memory joins with filter/flatMap/Map/Set
- Will hit Convex function memory/time limits as data grows
- Fix: Pre-aggregate analytics data via mutations

**4. Triple Full-Table Scan in `getLetterStats`**
- `convex/letters.ts:108-126` same pattern for summary numbers

### High

**5. Regex HTML Sanitization is Insufficient**
- `convex/pdf.ts:14-25` regex sanitizer bypassable with mixed case, entities, unquoted attrs
- Fix: Use `isomorphic-dompurify` (already installed)

**6. No Input Validation on PII Fields**
- `convex/clients.ts:169-181` accepts any string for `last4SSN`, `zipCode`, `email`, `state`
- Fix: Add format validation regex checks

**7. `getUser` Has No Auth Check**
- `convex/users.ts:29-34` returns any user record with no authentication

### Moderate

**8. Missing `by_role` Index on Users Table**
- Three queries in `users.ts` filter by `role` using `.filter()` (full table scan)
- Fix: Add `.index("by_role", ["role"])` to schema

**9. `craTarget`/`disputeType` Unvalidated**
- `convex/schema.ts:44-47` uses `v.string()` with no enum validation
- Fix: Use `v.union(v.literal(...))` in schema

**10. Inconsistent Audit Log Helper Usage**
- `users.ts` uses `createAuditLog`; `clients.ts` and `letters.ts` inline it
- `AuditAction` type missing `"letter_generated"`

**11. Missing Audit Log Indexes**
- No indexes on `createdAt`, `entityType`, or `action`
- Fix: Add `by_created_at`, `by_entity`, `by_action` indexes

### Low

- Hand-rolled frontend types instead of Convex-generated `Doc<>` imports
- `letters` table has no indexes (acceptable for now)
- Manual cascade deletion in `deleteClient` could approach operation limits for very active clients

### Positive Observations

- Correct use of queries vs. actions vs. mutations
- `requireAuth` helper is clean and reusable
- Foreign keys properly typed with `v.id("tableName")`
- Indexes on primary lookup keys (clerkId, email, username, clientId)
- Convex serialized isolation makes uniqueness checks in `completeOnboarding` safe

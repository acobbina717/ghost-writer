# Code Review — Consolidated Findings

**Date:** 2026-03-22
**Scope:** All uncommitted changes on `main`
**Total findings:** 60

---

## CRITICAL (5) — Must fix before merge

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 1 | `logGeneration` accepts `v.any()` for `formAnswers`, bypasses schema typing | `convex/letters.ts:435` | Change to `v.optional(v.record(v.string(), v.string()))` |
| 2 | `createLetter`/`updateLetter` accept `v.any()` for `formSchema` | `convex/letters.ts:317, 359` | Use the typed `formFieldValidator` or extract shared const |
| 3 | `"letter_generated"` audit action not in `AuditAction` union; inline `db.insert` diverges from `createAuditLog` helper | `convex/letters.ts:459`, `convex/lib/auth.ts:40-50` | Add to union type, use `createAuditLog` consistently |
| 4 | `img` tag allowed in XSS filter enables server-side request forgery — Browserless will fetch arbitrary `src` URLs | `convex/pdf.ts:9` | Restrict `img[src]` to `data:` URIs or remove `img` from allowlist |
| 5 | `craDisputeIds` correlation relies on flat array insertion order — if server reorders or concurrent mutations interleave, IDs map to wrong CRAs | `DisputeItemModal.tsx:920-932` | Have `createDisputeItems` return `{ id, craTarget }[]` or store association client-side |

---

## HIGH — Hardcoded & Duplicate Data (9)

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 6 | Social platform validation duplicated — `['telegram','discord','instagram']` hardcoded backend vs `SOCIAL_PLATFORMS` frontend | `convex/users.ts:122`, `OnboardingForm.tsx:25` | Single source in `convex/constants.ts` |
| 7 | `VALID_US_STATES` local to backend, not shared with frontend | `convex/clients.ts:13-17` | Move to `convex/constants.ts` |
| 8 | `PURGE_WARNING_DAYS` / `PURGE_DANGER_DAYS` defined in two places | `src/lib/constants.ts:32-38`, `convex/clients.ts:9-10` | Single source in `convex/constants.ts` |
| 9 | `CRA_OPTIONS` built identically in two files | `dispute-constants.ts:6`, `LetterForm.tsx:37` | Define once in `src/lib/constants.ts` |
| 10 | `DISPUTE_TYPE_TO_CRAS` is frontend-only, not validated server-side | `dispute-constants.ts:12-23` | Move to backend or simplify to exceptions-only |
| 11 | PDF iframe CSS (font, size, margins) duplicated 3 times with inconsistent padding (`0.75in` vs `1in`) | `convex/pdf.ts:62-72`, `DisputeItemModal.tsx:517-534`, `preview/page.tsx:213-229` | Extract shared `wrapHtmlForPreview()` utility |
| 12 | Browserless API URL hardcoded | `convex/pdf.ts:75` | Move to env var |
| 13 | Google Fonts `@import` for Arial — Arial is a system font, this request is useless | `convex/pdf.ts:66` | Remove the `@import` line |
| 14 | Duplicate validation constants between backend `VALID_DISPUTE_TYPES` and frontend `DISPUTE_TYPES` | `convex/clients.ts:24-27`, `dispute-constants.ts:3-14` | Shared import from `convex/constants.ts` |

---

## HIGH — Redundant Logic (5)

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 15 | Success rate calculation repeated 5+ times (same filter/round pattern) | `convex/letters.ts` (5x), `convex/clients.ts`, `clients/[id]/page.tsx` | Extract `computeRemovalRate()` utility |
| 16 | Auth "access denied" check copy-pasted in every client mutation | `convex/clients.ts` (3+ mutations) | Extract `requireClientAccess(ctx, user, clientId)` helper |
| 17 | Full-page spinner `<Center h="100vh"><Loader/></Center>` duplicated 10+ times after `FullPageLoader` was deleted | 10+ loading/page files | Recreate a simple `PageSpinner` component |
| 18 | Base64 PDF decode + download logic duplicated | `DisputeItemModal.tsx:280-295`, `preview/page.tsx` | Extract `downloadBase64Pdf(base64, filename)` utility |
| 19 | `Record<string, any>` used for `formAnswers` in 3 frontend files when schema is `Record<string, string>` | `hydrateTemplate.ts:57`, `DisputeItemModal.tsx:43`, `generate/page.tsx:22` | Update types to match schema |

---

## HIGH — Validation Gaps (5)

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 20 | `applicableCRAs` values not validated against `VALID_CRA_TARGETS` in `createLetter`/`updateLetter` | `convex/letters.ts:313-333, 369-378` | Add validation like `disputeTypes` already has |
| 21 | `clientInfoFields` accepts any strings, not validated against `CLIENT_INFO_FIELD_OPTIONS` keys | `convex/letters.ts:320-321` | Validate against known field keys |
| 22 | `maxDisputeItems` accepts zero/negative via `v.number()` — no server-side floor | `convex/letters.ts:321`, `convex/schema.ts` | Add `if (maxDisputeItems !== undefined && maxDisputeItems < 1) throw` |
| 23 | `dateOfBirth` stored as free-form string with no format validation | `convex/clients.ts:220, 265` | Add MM/DD/YYYY format check in `validateClientFields` |
| 24 | Email validation regex too permissive — accepts `a@b.c` and `@@@.@` | `convex/clients.ts:61` | Use stricter pattern or add length check |

---

## MEDIUM — Performance (3)

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 25 | `getDisputeTypePerformance` / `getRoundPerformance` call `.collect()` on ALL dispute items | `convex/letters.ts:235, 273` | Paginate or add scaling comment |
| 26 | N+1 queries in `getClientStats` and `getClientsWithDisputes` | `convex/clients.ts:92-109, 183-197` | Acceptable at small scale; document threshold |
| 27 | N+1+M query pattern in `getTemplateStats` | `convex/letters.ts:53-80` | Consider pre-aggregating stats |

---

## MEDIUM — Security & Robustness (6)

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 28 | No upper bound on `createDisputeItems` batch size | `convex/clients.ts:418` | Add `if (items.length > 100) throw` |
| 29 | `bulkUpdateDisputeStatus` silently skips missing items, can partially apply before auth error; returns requested count, not actual | `convex/clients.ts:514-517` | Validate all items first, return actual count |
| 30 | `sessionStorage` access in `useMemo` fragile for SSR | `preview/page.tsx:27-34` | Use `useState` lazy initializer pattern |
| 31 | `formData-${disputeId}` sessionStorage key never cleaned up — stale entries accumulate | `generate/page.tsx:24`, `preview/page.tsx:27` | Clean up after PDF download |
| 32 | `'*': ['style', 'class']` wildcard in XSS allowlist lets any tag have arbitrary CSS (position overlay, data exfil via background-image) | `convex/pdf.ts:15` | Restrict `style` to specific tags or use CSS property allowlist |
| 33 | `incrementDisputeRound` has no upper bound on round number | `convex/clients.ts:560-583` | Add ceiling (e.g., `if (round >= 10) throw`) |

---

## MEDIUM — State Management (3)

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 34 | `createdDisputeIds` persists across CRA downloads but is never cleared on backward step navigation — stale IDs reused after edits | `DisputeItemModal.tsx:900-917` | Clear `createdDisputeIds` when navigating back to edit steps |
| 35 | Stepper `active` index not recalculated when CRA count changes — can exceed `totalSteps` if user removes CRAs | `DisputeItemModal.tsx:1321-1329` | Clamp `active` to `Math.min(active, totalSteps - 1)` on CRA change |
| 36 | `maxDisputeItems` uses falsy coercion (`\|\|`) — `0` silently becomes `undefined` (no limit) | `admin/letters/LetterForm.tsx:134` | Use `?? undefined` or explicit check |

---

## LOW — Inconsistencies (5)

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 37 | Raw Mantine breadcrumbs in `LetterForm.tsx` while new `PageBreadcrumbs` component exists | `admin/letters/LetterForm.tsx:163-168` | Use `PageBreadcrumbs` |
| 38 | `PageBreadcrumbs` uses `item.label` as React key — could collide | `PageBreadcrumbs.tsx:32` | Use index or label+href |
| 39 | Some `radius="xs"` overrides may be leftover after theme default moved to `sm` | Various `ThemeIcon` usages | Sweep and verify intentional |
| 40 | Verify `ExpandedDisputeRow` prop interface accepts new `clientId` prop | `ClientsTable.tsx:188`, `ExpandedDisputeRow.tsx` | Check types compile |
| 41 | `hydrateDisputeItemsList` hard-codes "Inquiry" as item label regardless of dispute type | `src/lib/hydrateTemplate.ts:133` | Use dispute type or generic "Item" label |

---

## LOW — Accessibility (2)

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 42 | Missing `aria-label` on icon-only buttons (Edit, carousel nav arrows) | `ClientDisputesTable.tsx:471-477`, `DisputeItemModal.tsx:1194-1229` | Add `aria-label="Edit"`, `aria-label="Previous"`, etc. |
| 43 | Expand/collapse chevron in `LetterAnalyticsTable` is a `<span>` with `onClick` — no `role="button"`, `tabIndex`, or `aria-label` | `LetterAnalyticsTable.tsx:~78` | Use `<ActionIcon>` or add proper ARIA attributes |

---

## LOW — Dead Code (4)

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 44 | `redPrimary` / `redHover` exports likely unused after action color rename | `src/theme/colors.ts:28-29` | Verify with grep and remove |
| 45 | `Link` import unused after breadcrumbs refactor | `preview/page.tsx:4` | Remove import |
| 46 | Dark mode CSS variables still defined in `variables.css` and `colors.ts` but `defaultColorScheme` set to `"light"` | `layout.tsx`, `variables.css`, `colors.ts` | Either test dark mode or remove dead CSS |
| 47 | `window.confirm()` used for destructive action — breaks design language, not testable | `DisputeItemModal.tsx:781` | Replace with Mantine confirmation modal |

---

## NIT — Readability & Polish (8)

| # | Finding | File(s) | Fix |
|---|---------|---------|-----|
| 48 | `DisputeItemModal` is 630+ lines — orchestration, PDF logic, stepper all in one file | `DisputeItemModal.tsx` | Extract `useLetterGeneration` hook and template selection step |
| 49 | `templateStats[letter._id]` accessed 5 times without destructuring | `DisputeItemModal.tsx:419-426`, `LetterSelectionModal.tsx:95-105` | `const stats = templateStats?.[letter._id]` |
| 50 | No CSP header (other security headers well done) | `next.config.ts` | Add report-only CSP initially |
| 51 | `logGeneration` uses raw `ctx.db.insert` instead of `createAuditLog` helper (related to #3) | `convex/letters.ts:459` | Use shared helper |
| 52 | `DISPUTE_TYPE_TO_CRAS` maps 80% of types to same 3 CRAs — low-value data structure | `dispute-constants.ts:12-23` | Simplify to exceptions-only approach |
| 53 | `getClient` returns `null` for not-found but DisputeItemModal only renders empty iframe with no error message | `DisputeItemModal.tsx` | Show user-facing error when client is `null` |
| 54 | `formAnswers` spread directly into hydration replacement map — non-string values coerced via `String()` producing `[object Object]` | `src/lib/hydrateTemplate.ts:187, 208` | Type as `Record<string, string>`, validate before spread |
| 55 | Magic number `350` / `300` for `ScrollArea` height — not responsive | `CraCustomizationStep.tsx:55`, `ReviewStep.tsx:40` | Use `calc()` or `mah` with responsive values |

---

## POSITIVE — What's Done Well

- Consistent row-level security across all client mutations
- Input validation with `validateClientFields`, typed validators on the backend
- PII moved from URL query params to `sessionStorage`
- Batch `createDisputeItems` replacing N individual mutations
- `xss` library replacing hand-rolled regex for PDF sanitization
- `sandbox=""` on preview iframes — solid XSS defense
- `getUserByClerkId` now requires auth and checks caller identity
- New indexes (`by_role`, `by_status`, `by_created_at`, `by_entity`) for query performance
- Audit logging across all mutations
- Keyboard event handlers on `StatCard` for accessibility
- Onboarding auth token pass-through for server-side queries

---

## Suggested Fix Order

1. **Critical #1-5** — Type safety, SSRF, data correlation
2. **High #6-14** — Consolidate all constants to single sources
3. **High #15-19** — Extract shared utilities, fix type mismatches
4. **High #20-24** — Add missing server-side validation
5. **Medium #28-36** — Robustness, state management, batch limits
6. **Everything else** — Performance, accessibility, dead code, polish

# Ghost-Writer Design & Brand Audit

**Date:** March 21, 2026
**Agents:** UX Architect, UX Researcher, UI Designer, Brand Guardian
**Scope:** Full UI/UX review, visual design system, brand consistency, user flow analysis

---

## Executive Summary

Ghost-Writer has **strong engineering fundamentals** — the Convex/Mantine/Clerk stack is well-chosen, the design token architecture is solid, and the component abstractions are clean. The problems are in the **experience layer**: aggressive visual styling that fights the brand name, user flows with too much friction for daily power use, and a brand identity that's pulling in two directions.

**Overall Score: 6.5/10** — Good bones, needs recalibration.

### Implementation Status (Updated March 21, 2026)

All 14 engineering items have been completed:

| ID | Item | Status |
|----|------|--------|
| D1 | Reduce heading weights | DONE (already correct) |
| D2 | Remove ALL CAPS | DONE (already correct) |
| D3 | Confirmation dialog on dispute type change | DONE |
| D4 | Add dedicated /clients route + nav link | DONE |
| D5 | Filter letter templates by CRA | DONE |
| D6 | Fix sessionStorage form data restoration | DONE |
| D7 | Add search, sort, pagination to ClientsTable | DONE |
| D8 | Add "Copy items to all CRAs" in dispute stepper | DONE |
| D9 | Fix Clerk auth hardcoded to dark mode | DONE |
| D10 | Add edit capability for dispute items | DONE |
| D11 | Create batch dispute creation mutation | DONE |
| D12 | Add round advancement flow | DONE |
| D13 | Add bulk status updates for dispute items | DONE |
| D14 | Add actions to expanded dashboard rows | DONE |

Remaining items (D22-D24) are product/brand decisions that require stakeholder input.

### The Core Tension

The name "Ghost-Writer" promises **subtlety, precision, and quiet competence**. The design delivers **aggression, urgency, and visual intensity** — red accents, weight-900 headings, ALL CAPS everywhere, 2px sharp corners. As the Brand Guardian put it: *"If Ghost-Writer were a person, the name says 'quiet professional in a well-tailored suit,' but the design says 'tactical operator in body armor.'"*

---

## Critical Issues (Fix First)

### 1. SessionStorage Data Loss Bug
**Agents:** UX Architect, UX Researcher

The letter generation form stores data in `sessionStorage` to pass between form → preview pages. Multiple breakage points:
- **Back navigation loses data** — form page initializes `useState({})` without reading sessionStorage on mount
- **Browser back button after download** — sessionStorage is cleared, preview renders with `{{unresolved_tags}}`
- **Tab duplication** — shared sessionStorage means one tab's download can break another
- **Page refresh on form** — form values only written to sessionStorage on "Preview" click, not during editing

**Fix:** Combine form and preview into a single page (eliminates the problem entirely), or at minimum use `router.replace` after download and restore form state from sessionStorage on mount.

**Files:** `src/app/(authenticated)/clients/[id]/generate/[disputeId]/page.tsx`, `preview/page.tsx`

---

### 2. No Search or Sort on Client Table
**Agents:** UX Researcher, UX Architect

Zero search capability anywhere in the app. The ClientsTable uses TanStack Table but only enables `getCoreRowModel` and `getExpandedRowModel` — no filtering, sorting, or pagination. Unusable at 50+ clients.

**Fix:** Add `getFilteredRowModel`, `getSortedRowModel`, `getPaginationRowModel`. Add a search input above the table. Default sort by pending items descending. ~2-4 hours of work.

**File:** `src/app/(authenticated)/dashboard/ClientsTable/ClientsTable.tsx`

---

### 3. Clerk Auth Hardcoded to Dark Mode
**Agents:** UI Designer, Brand Guardian

The `clerkAppearance` object in `layout.tsx` exclusively references `darkColors.*`. When a user has light mode active, Clerk auth screens still render dark. This is a functional bug.

**Fix:** Create conditional appearance objects or CSS-based overrides that respond to `data-mantine-color-scheme`.

**File:** `src/app/layout.tsx` (lines 22-161)

---

### 4. Letter Generation Flow: Too Many Pages, Too Many Clicks
**Agents:** UX Architect, UX Researcher

Generating one letter requires: modal selection → full page navigation to form → second full page navigation to preview → download → auto-redirect. **Three context switches for a fill-and-print operation.**

For a client with 9 dispute items (3 creditors x 3 CRAs), that's **45-81 clicks and 18 page navigations** to generate all letters. This is the #1 productivity bottleneck.

**Fix:** Collapse form and preview into a single split-view page. Add batch letter generation (the schema already supports `disputeItemIds` as an array).

**Files:** `generate/[disputeId]/page.tsx`, `generate/[disputeId]/preview/page.tsx`

---

### 5. Clients List Buried in Dashboard
**Agents:** UX Architect, UX Researcher

Team members see only "Dashboard" in the sidebar — no dedicated "Clients" nav item. The dashboard IS the client list with stats glued on top. These are conceptually different: dashboard = "what needs attention," clients = "find a specific client."

Admins get a completely different dashboard (letter analytics) with **no client access at all**.

**Fix:** Add a "Clients" nav link for all roles. Create a dedicated `/clients` route. Give admins both views.

**File:** `src/components/AppShell/NavLinks.tsx`

---

## High Priority Issues

### 6. ALL CAPS Overuse — #1 Readability Issue
**Agents:** UI Designer, Brand Guardian, UX Architect

ALL CAPS is applied in **12 distinct places**: buttons, TextInput labels, Textarea labels, Select labels, table headers, stat card labels, nav sections, user role text, contact info labels, and all Clerk UI. Research shows uppercase reduces reading speed 13-20%. When everything is uppercase, nothing is emphasized.

**Fix:** Keep uppercase ONLY for table headers, nav section labels, and badges. Remove from buttons and form labels.

**File:** `src/theme/ghost-theme.ts` (lines 78-154)

---

### 7. Weight 900 on All Headings Flattens Hierarchy
**Agents:** UI Designer, Brand Guardian

Every heading (h1-h4) uses `fontWeight: '900'`. An h4 at 16px/900 doesn't differentiate from h3 at 20px/900. The hierarchy depends entirely on size, which is fragile.

**Fix:** Progressive weight: h1: 900, h2: 700, h3: 600, h4: 500.

**File:** `src/theme/ghost-theme.ts` (lines 13-22)

---

### 8. Red as Primary — Brand & Trust Problem
**Agents:** Brand Guardian, UI Designer

- Brand primary `#E21C1C` is nearly indistinguishable from semantic error `#EF4444`
- Red on dark backgrounds borderline fails WCAG AA at small sizes (11-12px)
- In financial contexts, red = losses, danger, "in the red"
- Primary buttons, error states, negative dispute outcomes, and sign-out all use the same color

**Fix (if red is mandatory):** Shift `primaryShade` to `{ light: 6, dark: 5 }` for accessibility. Move semantic error to a distinct hue (orange-red). Consider using red only for brand moments (logo, header) and a neutral color for primary actions.

**Files:** `src/theme/colors.ts`, `src/theme/ghost-theme.ts`

---

### 9. Dispute Stepper Forces Duplicate Data Entry
**Agents:** UX Researcher

Per-CRA steps require re-entering the same creditor name/account for each bureau. A user disputing Chase across 3 CRAs types "Chase" three times. No copy mechanism exists.

**Fix:** Add "Copy items to all CRAs" checkbox, or restructure as creditor-first (enter creditor once, check which CRAs).

**File:** `src/app/(authenticated)/clients/[id]/DisputeItemModal.tsx`

---

### 10. No Edit Capability for Dispute Items
**Agents:** UX Researcher

Once created, dispute items can't be edited (only status changes). Typos in creditor name or account number — which flow directly into legal letters — require delete and recreate. The schema has `updatedAt`, suggesting edit was planned.

**Fix:** Add edit functionality for creditor name, account number, and dispute type.

**File:** `src/app/(authenticated)/clients/[id]/ClientDisputesTable.tsx`

---

### 11. No Round Advancement Flow
**Agents:** UX Researcher

`currentRound` exists in the schema and displays in the UI, but there's no way to advance it. Round advancement (dispute sent → bureau responds → send next round with different template) is a core credit repair workflow.

**Fix:** Add "Start Next Round" action that increments round and optionally prompts letter generation.

---

### 12. Dispute Type Change Silently Destroys All Data
**Agents:** UX Researcher

Changing the dispute type dropdown in step 1 resets `craTargets` and `craItems` to empty with no confirmation. If a user has filled 3 CRAs worth of items and accidentally changes type, everything is gone.

**Fix:** Add confirmation dialog when items exist: "Changing type will clear all items. Continue?"

**File:** `src/app/(authenticated)/clients/[id]/DisputeItemModal.tsx` (lines 61-66)

---

### 13. Sequential API Calls Create Partial Failure Risk
**Agents:** UX Researcher

`handleSubmit` creates dispute items in a sequential `for` loop. If the 3rd of 5 mutations fails, 2 items are orphaned with no indication of which succeeded.

**Fix:** Batch creation in a single Convex mutation, or show per-item success/failure with retry.

**File:** `src/app/(authenticated)/clients/[id]/DisputeItemModal.tsx` (lines 107-158)

---

## Medium Priority Issues

### 14. No Breadcrumbs
The letter generation flow is 4 levels deep (Dashboard → Client → Generate → Preview) with only individual "Back to X" links. Users lose spatial awareness.

### 15. Tables Not Responsive
ClientsTable (6 columns) and ClientDisputesTable (7 columns) overflow on mobile with no horizontal scroll wrapper or column hiding.

### 16. Dual CSS Variable System Will Drift
`colors.ts` and `variables.css` are manually kept in sync. No build step enforces this. Values will diverge.

### 17. Interactive StatCard Has No Keyboard Support
Clickable cards use `onClick` on a `<div>` — not keyboard-focusable, no ARIA role, no screen reader announcement.

### 18. No Hover/Active States on Interactive Elements
StatCard and LetterSelectionModal cards have `cursor: pointer` but no visual hover feedback (no shadow lift, no border change, no transition).

### 19. Letter Templates Not Filtered by CRA
LetterSelectionModal shows all templates regardless of the dispute item's CRA target. The `applicableCRAs` field exists but isn't used for filtering.

### 20. No Bulk Status Updates
Updating 10 dispute items' statuses requires 10 individual dropdown changes with 10 API calls.

### 21. Expanded Dashboard Rows Are Read-Only
ExpandedDisputeRow shows data but no action buttons. Creates expectation of interactivity that isn't fulfilled.

### 22. Pending Items Filter Hidden in Stat Card Click
Only discoverable via "Click to filter" subtitle text. Inconsistent with non-interactive stat cards.

---

## Brand Recommendations

### Keep These (They Work)
- **"Ghost-Writer" name** — memorable, domain-appropriate, strong metaphor
- **Satoshi typeface** — distinctive, modern, readable
- **JetBrains Mono** — appropriate for code/IDs
- **Design token architecture** — `colors.ts` → `ghost-theme.ts` → `variables.css` is well-engineered
- **Dark mode palette** — the surface layers, text hierarchy, and border system are excellent (9/10)
- **PII purge feature** — genuine differentiator, should be surfaced as a trust signal

### Change These (Brand Pivot)

| Current | Recommended | Why |
|---------|-------------|-----|
| Weight 900 everywhere | 900 for h1 only, progressive descent | Hierarchy needs contrast |
| ALL CAPS on 12 element types | Only table headers + nav sections | Readability, reduces visual aggression |
| 2px default radius | 4-6px default | Less militant, more professional |
| Red as primary action color | Red for brand accents only; neutral for actions | Trust, error disambiguation |
| Generic notifications | "Ghost" persona voice | Brand personality development |
| Plain text logo | Minimal brand mark (GW monogram or ghost icon) | Visual identity |
| Dark mode default | Light mode default (dark as option) | Matches well-lit office use |

### Develop the "Ghost" Persona
The onboarding copy says "Ghost will verify your identity" — then the persona disappears entirely. Either develop it consistently (notifications, empty states, loading states) or remove it.

---

## Quick Wins (< 1 Day Each)

1. **Add "Clients" nav link** — 30 minutes
2. **`router.replace` after PDF download** — 1 line change
3. **Filter letter templates by CRA** — 1-2 hours
4. **Add search to clients table** — 2-4 hours
5. **Reduce heading weights** — 1 line in theme
6. **Remove ALL CAPS from buttons** — 1 line in theme
7. **Add confirmation on dispute type change** — 1 hour
8. **Use `EmptyState` component on client detail** — 30 minutes
9. **Fix CraCustomizationStep card radius inconsistency** — 1 line
10. **Standardize cancel button variants to `variant="default"`** — 30 minutes

---

## Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Token Architecture | 9/10 | Excellent, needs sync automation |
| Information Architecture | 5/10 | Clients buried, admin disconnected |
| User Flow Efficiency | 4/10 | Too many clicks for core workflows |
| Visual Hierarchy | 5/10 | Flat weights, uppercase saturation |
| Color System | 7/10 | Strong neutrals, red-as-primary is risky |
| Dark Mode | 9/10 | Best part of the system |
| Light Mode | 5/10 | Clerk bug, secondary citizen |
| Component Consistency | 6/10 | Several drift points |
| Responsive Design | 4/10 | Tables break on mobile |
| Accessibility | 5/10 | Missing keyboard support, ARIA |
| Brand Coherence | 4/10 | Name and design pull opposite directions |
| Power User Efficiency | 3/10 | No batch ops, no search, no shortcuts |
| Error Prevention | 5/10 | Silent data destruction, partial failures |

**Overall: 5.5/10** — Strong foundation with significant experience-layer gaps.

---

## Engineering Team Ownership

The following items from this audit require engineering work (backend mutations, page architecture, auth integration, data wiring) and should be picked up by the engineering team:

### Critical
| # | Item | Details |
|---|------|---------|
| 1 | **SessionStorage data loss bug** | Form page doesn't restore state from sessionStorage on mount. Back navigation from preview loses all form data. Consider combining form + preview into a single page to eliminate the problem entirely. Files: `generate/[disputeId]/page.tsx`, `preview/page.tsx` |
| 2 | **Add search/sort to client table** | Enable TanStack Table's `getFilteredRowModel`, `getSortedRowModel`, `getPaginationRowModel`. Add search input above table. File: `ClientsTable/ClientsTable.tsx` |
| 3 | **Clerk auth hardcoded to dark mode** | `clerkAppearance` in `layout.tsx` exclusively references `darkColors.*`. Light mode users see dark Clerk screens. Need conditional appearance objects or CSS-based overrides. File: `layout.tsx` |
| 4 | **Combine form + preview into single page** | Current letter generation requires 3 page transitions. Collapse into a split-view (form left, live preview right) or tabbed layout. Eliminates sessionStorage pattern entirely. Files: `generate/[disputeId]/page.tsx`, `preview/page.tsx` |
| 5 | **Create dedicated `/clients` route** | Separate client list from dashboard. Dashboard = overview/stats, Clients = searchable/sortable client list. Give admins access to both. Nav link already added pointing to `/dashboard` as interim. |

### High Priority
| # | Item | Details |
|---|------|---------|
| 7 | **"Copy items to all CRAs" in dispute stepper** | Add checkbox or button to duplicate creditor/account entries across all selected CRAs. Currently users re-type the same creditor name per CRA step. File: `DisputeItemModal.tsx` |
| 8 | **Add edit capability for dispute items** | Creditor name, account number, and dispute type cannot be edited after creation. Typos require delete + recreate. Schema already has `updatedAt`. Need new mutation + edit modal. File: `ClientDisputesTable.tsx` |
| 9 | **Round advancement flow** | `currentRound` exists in schema but no UI to advance it. Add "Start Next Round" action that increments round and optionally prompts letter generation. Core credit repair workflow. |
| 10 | **Confirmation dialog on dispute type change** | `handleDisputeTypeChange` silently resets all CRA targets and items. Add confirmation when items exist. File: `DisputeItemModal.tsx` (lines 61-66) |
| 11 | **Batch dispute creation mutation** | `handleSubmit` uses sequential `createDisputeItem` calls in a for loop. Partial failures leave inconsistent state. Consolidate into single Convex mutation. File: `DisputeItemModal.tsx` (lines 107-158) |
| 17 | **Filter letter templates by CRA** | `LetterSelectionModal` shows all templates regardless of dispute item's CRA target. Filter using existing `applicableCRAs` field. File: `LetterSelectionModal.tsx` |
| 18 | **Bulk status updates** | Add row selection checkboxes to disputes table with bulk action bar for status changes. |
| 19 | **Actions in expanded dashboard rows** | `ExpandedDisputeRow` is read-only. Add "Generate Letter" and status dropdown to expanded view. File: `ExpandedDisputeRow.tsx` |

### Decisions Needed (Product/Brand)
| # | Item | Notes |
|---|------|-------|
| 22 | **Develop "Ghost" persona** | Onboarding says "Ghost will verify your identity" then persona disappears. Decide: develop it consistently across notifications/empty states, or remove it. |
| 23 | **Brand mark / logo** | Header is plain text. Even a simple GW monogram or ghost icon would create visual identity. Needs design asset creation. |
| 24 | **Light mode as default** | Dark mode is current default. Credit repair specialists typically work in well-lit offices. Consider making light mode default with dark as opt-in. |

---

*Report compiled from parallel audits by UX Architect, UX Researcher, UI Designer, and Brand Guardian agents.*

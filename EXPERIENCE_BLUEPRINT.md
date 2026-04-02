# 🖋️ Ghost-Writer Experience Blueprint (v3.1) - Horizontal Workbench Spec

This document serves as the master specification for the design and engineering team. It outlines the transition from a standard admin tool to an **Elite Professional Workbench**, specifically tailored for high-volume credit repair agents.

---

## 1. AppShell V2: The "Wide-Screen" Architecture
**Goal:** Reclaim the 260px vertical sidebar to give the Editor and Data Tables 100% of the horizontal monitor width.

### A. Layer 1: The Command Header (60px)
*   **Structure:** `[Logo] --- [Centered Omni-Search] --- [Theme Toggle | Profile Menu]`
*   **Aesthetic:** `var(--bg-surface)` with a 1px solid `var(--border-default)` bottom border.
*   **The Hero:** The **Omni-Search Bar** must be perfectly centered and span a maximum of 600px. It should use `Kbd` indicators that are OS-aware (`⌘ K` vs `Ctrl K`).
*   **Engineering Rationale:** High-priority system actions are grouped at the very top, mimicking the "Browser Bar" mental model. This keeps "Identity" and "Discovery" separate from "Navigation."

### B. Layer 2: The Context Ribbon (48px)
*   **Structure:** `[Breadcrumbs (Left)] --- [Navigation Links (Right)]`
*   **Background:** `var(--bg-base)` (Soft Gray) to distinguish it from the Command Header.
*   **Breadcrumbs:** Stays anchored to the left. Represents "Where I am."
*   **Nav Links:** Horizontal `Tabs` or `NavLinks` on the right. Represents "Where I can go."
    *   *Interaction:* Active links get a 2px `Slate Blue` bottom border.
    *   *Scalability:* Trigger "More" dropdown at **6+ links**.
    *   *Pending Badge:* Use a subtle inline indicator (e.g., `Team (3)`) rather than a circular badge to maintain horizontal alignment.
*   **Engineering Rationale:** This layer tethers the user's specific task (Breadcrumbs) to their global shortcuts (Nav), providing a "Zero-Confusion" navigation experience.

---

## 2. The Workbench: "Elite Throughput"
**Goal:** Zero page loads between data entry and document output. The editor should feel like a physical desk.

### A. The "Desk" Layout (Admin Editor)
*   **Background:** The page background should be `var(--bg-base)` (Soft Gray), mimicking a physical desktop.
*   **The Paper (Center):** The Tiptap Editor should be styled as a white "Sheet of Paper" (`max-width: 816px` for A4 ratio). It should have a subtle `var(--mantine-shadow-sm)` and be centered.
*   **The Gutter (Left):** Context-aware Smart Tags float in the gray space to the left of the paper.
    *   **Responsive Behavior:**
        *   **1440px+**: Tags float in the left gutter (absolute positioned).
        *   **1280px-1439px**: Tags collapse to a narrow icon-only column.
        *   **< 1280px**: Tags move to a collapsible panel below the editor toolbar.
*   **The Mirror (Right):** The Live PDF Preview stays in a **Grid Column** to the right of the paper.
    *   *Rationale:* Predictable synced scrolling is more important than "floating" aesthetics for production work.
*   **Engineering Rationale:** This mimics a physical document workflow. By centering the "Paper," we reduce neck strain and create a high-focus writing environment.

### B. Context-Aware "Magic" Sidebar (Editor)
*   **Trigger:** `onFocus` within the Tiptap editor.
*   **Inside Dispute Block:** Highlight/Show only `{{item_...}}` tags.
*   **Outside Dispute Block:** Highlight/Show only `{{client_...}}` and `{{system_...}}` tags.
*   **Engineering Rationale:** Prevents technical errors by only offering tools relevant to the current cursor position.

---

## 3. Dashboard Intelligence: "The Success Layer"
**Goal:** Move from "Data Lists" to "Decision Tools."

### A. The Round Performance "Success Funnel" (Admin)
*   **Visual:** Horizontal bar chart with tiered opacity.
*   **Design:** 
    *   **Round 1:** Wide bar, 100% opacity Slate Blue.
    *   **Round 2:** Medium bar, 70% opacity.
    *   **Round 3:** Narrow bar, 40% opacity.
*   **Engineering Rationale:** Visually communicates the "Law of Diminishing Returns" per round, helping Admins identify failing templates.

### B. The "Ring of Success" (Portfolio Rates)
*   **Component:** Mantine `RingProgress` inside StatCards.
*   **Logic:** Visualize `(Items Removed / Total Resolved Items)`.
*   **Engineering Rationale:** Provides a professional sense of progress and closure for the Agent.

---

## 4. Mobile Optimization: "The Thumb-Tap Flow"
**Goal:** Desktop power on a 6-inch screen.

### A. Bottom Navigation Bar
*   **Action:** Navigation moves from the header to a sticky **Bottom Tab Bar** on mobile.
*   **Structure:** Hard limit of 4 tabs: `[Dashboard] [Search] [Clients] [Profile]`.
*   **Admin Access:** Admin-only pages remain accessible via the **Omni-Search** (triggered by the Search tab). This keeps the mobile UI focused on high-frequency tasks.
*   **Engineering Rationale:** The most ergonomic position for one-handed mobile use. It keeps the core "Loop" within thumb reach.

### B. "Sunglasses" Eye-Comfort Mode
*   **Action:** A toggle icon in the Preview header.
*   **Effect:** Applies `backdrop-filter: sepia(0.3) brightness(0.9)` to the preview iframe.
*   **Rationale:** We are opting for the more aggressive `sepia(0.3)` to ensure a meaningful reduction in white-point glare for light-sensitive users.
*   **Engineering Rationale:** Softens the white PDF glare for mobile/low-light environments while keeping the *actual* PDF output crisp white.

---

## 5. Engineering Review & Notes (Updated 2026-03-31)

> **Status:** Finalized by the design team. Address the following decisions during implementation.

### Section 1B — Context Ribbon
- **Overflow:** Trigger "More" menu at 6+ links.
- **Pending Badge:** Inline indicator on the tab label (e.g., `Team (3)`). Use secondary text color or subtle red for the number.

### Section 2A — "Desk" Layout
- **Responsive Gutter:** 1440px+ (floating), 1280-1439px (collapsed icon column), <1280px (integrated below toolbar).
- **Preview Position:** **Option (B) - Stay in a Grid column** to the right for predictability and synced scrolling.

### Section 4A — Mobile Tabs
- **Tab Count:** Limit to 4: `[Dashboard] [Search] [Clients] [Profile]`.
- **Admin Access:** Admin pages accessible via Omni-Search ONLY on mobile.

### Section 4B — Sunglasses Mode
- **Filter Values:** Use `backdrop-filter: sepia(0.3) brightness(0.9)`.

---

## 6. Engineering Handoff Summary
1.  **AppShell Refactor:** Remove `Navbar` and implement the **Dual-Layer Header** (Command Header + Context Ribbon).
2.  **Omni-Search Center:** Centered in Layer 1.
3.  **Breadcrumb Anchor:** Move `PageBreadcrumbs` into Layer 2 (Left).
4.  **Nav Migration:** Move `NavLinks` logic into Layer 2 (Right) as horizontal tabs with active bottom border.
5.  **Workbench Pivot:** Implement the centered "Paper" layout in the Letter Editor with responsive gutter tags.
6.  **Mobile Bottom Nav:** Build sticky bottom tab bar for mobile (4 tabs max).

---

## 7. Implementation Tracker & Known Gaps (Updated 2026-04-01)

> **Team Spin-up:** Design Team (Gemini) and Engineering Team (Claude) have been activated to execute the V2 workbench transition.

### 🔴 Immediate Gaps (Blocking "Elite" Experience)
- **[x] Theme Integrity:** FIXED (2026-04-01)
    - [x] `defaultColorScheme` changed from `"light"` to `"auto"` in `layout.tsx` (all 4 instances).
    - [x] Hardcoded hex in `global-error.tsx` replaced with `prefers-color-scheme` media queries.
    - [x] Clerk `cardBox` shadow now uses `var(--shadow-lg)` instead of hardcoded rgba.
- **[x] Smart Tags Visibility:** Missing from the client-facing `DisputeGenerateModal.tsx`.
    - [x] Design Spec finalized: "Magic" Status-Aware Reference Gutter (2026-04-01).
    - [x] Implementation in `DisputeGenerateModal.tsx` COMPLETE (2026-04-01).

### 🏗️ Active Development tasks
- **[x] Phase 2: Logic & Interactivity**
    - [x] Verify mid-range (1280-1439px) icon-only column — confirmed working.
    - [x] Implement "Magic" Status-Aware Reference Gutter in `DisputeGenerateModal.tsx`.
    - [x] Elite Polish Implementation: Standardized spacing, typography, and Mantine values globally (2026-04-01).
- **[x] Phase 3: Visual Intelligence** (COMPLETE 2026-04-02)
    - [x] Implement Mantine `RingProgress` in StatCards — live in `StatCard.tsx`.
    - [x] Build the "Success Funnel" bar chart for Dashboard analytics — live in `SuccessFunnel.tsx`, mounted in `AdminDashboard.tsx`.
- **[x] Phase 4: Mobile Optimization** (COMPLETE 2026-04-02)
    - [x] Bottom Navigation Bar — `MobileBottomNav.tsx`, 4 tabs (Dashboard, Search, Clients, Profile menu).
    - [x] "Sunglasses" Eye-Comfort Mode — `LetterForm.tsx` + `DisputeGenerateModal.tsx`, `yellow.6` active state, `sepia(0.3) brightness(0.9)` filter.

### ✅ Completed
- [x] Experience Blueprint V3.1 Drafting & Approval.
- [x] Team Role definitions (Leo, Maya, Jax, Sloane, Kai).
- [x] Phase 1 Foundation Fixes — theme `auto`, error page dark mode, Clerk shadow token (2026-04-01).


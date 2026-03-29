# Ghost-Writer Brand Identity System

**Brand Guardian Sessions** | March 21-22, 2026
**Status:** Active reference document
**Applies to:** All Ghost-Writer touchpoints, components, copy, and visual design

---

## 1. Brand Positioning

### Positioning Statement

Ghost-Writer is an internal automation hub for credit repair professionals who need to generate personalized dispute letters with speed, accuracy, and legal defensibility. Unlike generic document tools or manual letter writing, Ghost-Writer operates as an invisible specialist -- it handles the complex template logic, bureau targeting, and PII management so the operator can focus on client strategy.

### Who It Is For

**Primary:** Credit repair team members who manage client portfolios and generate dispute letters daily. These are practitioners, not technologists. They work in well-lit offices, manage 20-100+ clients at a time, and care about throughput and accuracy. They need a tool that gets out of their way.

**Secondary:** Team administrators who manage letter templates, onboard team members, and monitor portfolio-wide performance metrics. They need oversight without micromanagement tooling.

### What It Does

Manages the full dispute lifecycle: client intake, dispute item creation across credit reporting agencies, template selection, personalized letter generation with smart-tag hydration, and PDF output. It tracks rounds, logs generations for compliance, and maintains audit trails.

Critically, Ghost-Writer is also a learning system. Every letter generated, every dispute status updated, and every round advanced becomes a data point. Over time, Ghost accumulates outcome intelligence -- which templates succeed at which bureaus, which dispute types resolve fastest, which rounds produce results. This data feeds back into template improvement and practitioner decision-making. The operator gets faster; Ghost gets smarter. Both sides improve over time.

### Why It Is Different

Ghost-Writer is not a SaaS platform trying to sell credit repair to consumers. It is a practitioner's workbench -- internal, focused, opinionated about workflow. The brand does not need to convert strangers or explain credit repair. It needs to feel like a trusted tool that a professional reaches for every morning without thinking about it.

### The Brand Promise

**Ghost-Writer does the writing. You do the thinking.**

The tool disappears into the workflow. It does not demand attention, celebrate itself, or create friction. When it works well, you forget it is there -- which is exactly what a ghost writer should do.

The deeper promise is about what happens at scale: **Ghost-Writer makes you faster today and better tomorrow.** Faster today because the dispute-to-letter pipeline eliminates manual work. Better tomorrow because success rate tracking turns every generated letter into a data point that informs the next decision. The practitioner does not need to gather this intelligence themselves -- Ghost collects it silently, just by doing its job.

---

## 2. Brand Personality and Voice

### Personality Archetype: The Quiet Professional

Ghost-Writer is the colleague who never grandstands but always delivers. Think of a senior paralegal, not a courtroom litigator. Competent, composed, precise, and slightly understated. The kind of person who has already anticipated what you need before you ask.

This is not a consumer-facing product competing for attention in an app store. It does not need to be exciting. It needs to be trustworthy.

### Five Personality Traits

| Trait | What It Means | What It Does Not Mean |
|-------|--------------|----------------------|
| **Precise** | Exact language, no ambiguity, correct data handling | Pedantic, robotic, or cold |
| **Understated** | Confidence without showmanship, restraint in visual expression | Boring, lifeless, or invisible |
| **Reliable** | Consistent behavior, predictable UI, no surprises | Rigid, inflexible, or old-fashioned |
| **Efficient** | Shortest path to outcome, no unnecessary steps or decoration | Sparse, unfinished, or rushed |
| **Protective** | PII-aware, compliance-conscious, data-cautious | Paranoid, restrictive, or paternalistic |

### Voice Characteristics

**Tone:** Calm, direct, and grounded. Ghost-Writer speaks in declarative sentences. It states facts, confirms actions, and surfaces next steps. It does not use exclamation marks, self-congratulation, or unnecessary superlatives.

**Register:** Professional but not corporate. Write the way a competent colleague talks at their desk -- clear, natural, no jargon for jargon's sake.

**Perspective:** Third-person when referring to itself as "Ghost." Never first-person ("I") because the tool is a system, not a character with feelings. Never second-person imperatives ("You must...") in system copy because the operator is the authority.

### Tone Spectrum

The voice stays within a narrow band. Ghost-Writer is never loud, never cute, and never anxious.

| Context | Tone | Example |
|---------|------|---------|
| **Idle / Dashboard** | Calm, ready | "Ghost is ready. Pick up where you left off." |
| **Empty state** | Inviting, grounded | "Ghost is standing by. Add your first client to get started." |
| **Success** | Quiet confirmation | "Letter generated." / "Dispute created." |
| **Loading** | Neutral, brief | "Working..." / "Generating letter..." |
| **Error** | Honest, non-alarming | "Ghost hit a snag. The team has been notified." |
| **Warning** | Direct, factual | "Changing type will clear all items." |
| **Admin context** | Professional, slightly elevated | "Manage templates and monitor the team." |
| **PII / Compliance** | Firm, protective | "Client data will be purged after 91 days." |

### Copy Patterns to Follow

- **Short sentences.** "Letter generated." not "Your letter has been successfully generated!"
- **Active voice.** "Ghost created 3 dispute items." not "3 dispute items were created by the system."
- **No celebration.** The tool did its job. That is the expectation, not an achievement.
- **No filler.** "Add client" not "Go ahead and add your first client to get things rolling!"
- **No hedging.** "Ghost hit a snag." not "Oops! Something might have gone wrong."
- **Name it, do not explain it.** "Letter generated." not "The letter you requested has been generated and is ready for download."

### Copy Anti-Patterns (Never Do This)

| Pattern | Why Not | Instead |
|---------|---------|---------|
| "Awesome! Letter created!" | Celebration is unprofessional for a work tool | "Letter generated." |
| "Oops! Something went wrong" | Cutesy error copy erodes trust | "Ghost hit a snag." |
| "You haven't added any clients yet" | Accusatory tone | "No clients yet." |
| "Click here to get started!" | Patronizing, assumes unfamiliarity | "Add Client" (button) |
| "Are you sure you want to..." | Overused, meaningless confirmation | "This will clear all items. Continue?" |
| "Successfully completed!" | Redundant -- if it is done, it succeeded | "Done." or no message at all |

---

## 3. Visual Identity Recommendations

### The Color Decision: Red Becomes Accent

**Recommendation: Move red out of the primary action role. Keep it as the brand signature color for identity moments only.**

Here is the reasoning:

1. **The name "Ghost-Writer" promises subtlety.** A red-dominated interface is the visual equivalent of shouting in a library. The metaphor demands restraint.

2. **Red conflicts with semantic meaning.** In this application, red already means "error" (`#E5484D`), "verified/negative outcome" (dispute status), and "destructive action" (sign out, delete). When the primary action button is also red, users cannot distinguish "proceed" from "danger" at a glance.

3. **Financial context.** Credit repair professionals work in a domain where "in the red" means bad. A tool that is constantly red does not inspire trust in a financial context.

4. **Red fatigue.** When everything is the accent color, nothing is. Red loses its power to draw attention to the things that actually matter -- the brand mark, critical warnings, the ghost icon.

### New Color Strategy

```
BRAND SIGNATURE (identity moments only):
  OTF Red #E21C1C -- ghost icon, brand mark, login page title accent,
                      and nowhere else in the functional UI

PRIMARY ACTION (buttons, links, focus rings, active states):
  Slate Blue #4B6BFB -- trustworthy, professional, distinct from all
                        semantic colors, excellent contrast in both modes

  Full scale:
    50:  #EEF2FF
    100: #E0E7FF
    200: #C7D2FE
    300: #A5B4FC
    400: #818CF8
    500: #6366F1
    600: #4B6BFB  (primary)
    700: #4338CA  (hover)
    800: #3730A3  (active/pressed)
    900: #312E81  (darkest)

SEMANTIC (unchanged, already well-chosen):
  Success: #10B981 (green)
  Warning: #F59E0B (amber)
  Error:   #E5484D (rose-red, visually distinct from OTF Red)
  Info:    #0EA5E9 (sky blue)

NEUTRALS (unchanged -- these are excellent):
  Light mode and dark mode palettes remain as-is.
  The surface/border/text hierarchy is the strongest part of the system.
```

### Why Slate Blue

- **Trust:** Blue is the most universally trusted color in financial and professional tooling. It is what operators expect from a serious work tool.
- **Distinction:** It is visually distant from every semantic color (green, amber, red, sky). No ambiguity.
- **Restraint:** It does not fight with the brand red. When the ghost icon is the only red element on screen, it has ten times the impact.
- **Accessibility:** Slate blue at 600 passes WCAG AA on both light and dark surfaces at all text sizes used in the system.
- **The "ghost" metaphor:** A muted, cool-toned interface with a single controlled burst of red is exactly what "quiet professional with a signature" looks like.

### Where Red Still Lives

Red is not being removed. It is being promoted from "color of everything" to "color that means Ghost-Writer." This is a more powerful role.

| Touchpoint | Color | Purpose |
|------------|-------|---------|
| Ghost icon in header | OTF Red `#E21C1C` | Brand signature |
| Ghost icon on login page | OTF Red | Brand identity moment |
| Favicon / browser tab icon | OTF Red ghost | Brand recognition |
| Brand mark (if developed) | OTF Red | Trademark element |
| Focus ring outer glow | OTF Red at 20% opacity | Subtle brand touch |
| Everything else | Slate Blue or Neutral | Functional UI |

### Where Red Must Not Live

- Primary action buttons (use Slate Blue)
- Navigation active states (use Slate Blue)
- Links (use Slate Blue)
- Form focus states (use Slate Blue)
- Success/progress indicators (use semantic green)
- Badge notification dots (use Slate Blue or semantic yellow)
- Loading spinners (use Slate Blue or neutral)

### Typography Hierarchy (Confirmed)

The current system is correct after the audit fixes. Preserve these decisions:

```
Typefaces:
  Primary: Satoshi (sans)     -- all headings, body, UI elements
  Monospace: JetBrains Mono   -- account numbers, IDs, code-like data

Weight Hierarchy (already implemented):
  h1: 900 (32px) -- page titles only, one per page
  h2: 700 (24px) -- section headers
  h3: 600 (20px) -- card titles, group headers
  h4: 500 (16px) -- sub-sections, labels with emphasis

Body Text:
  Regular: 400
  Labels: 500
  Buttons: 600
  Table headers: 500 + uppercase + letter-spacing 0.1em

Letter Spacing:
  -0.02em on h1 only (tightened for display size)
  0.1em on table headers and section labels (spaced for small caps effect)
  Normal everywhere else
```

### Radius System (Confirmed)

The 4px default (`sm`) is correct. This is the right balance between the original 2px (too sharp, too aggressive) and a rounded aesthetic (too casual for a professional tool).

```
xs: 2px  -- badges, tiny elements
sm: 4px  -- buttons, inputs, cards (DEFAULT)
md: 8px  -- modals, dropdowns, popovers
lg: 12px -- large containers, feature cards
xl: 16px -- special cases only
```

### Iconography Approach

**Stay with Tabler Icons.** The stroke-1.5 weight, the consistent sizing at 16/18/20/48px tiers, and the comprehensive set are all correct for this application. No custom icon library is needed for an internal tool.

Guidelines:
- Use `stroke={1.5}` consistently (this is already the case)
- Navigation icons: 18px
- Stat card icons: 20px
- Empty state icons: 48px
- Inline text icons: 16px
- Never use filled icon variants except for `IconGhostFilled` (the brand mark)

### Brand Mark Direction

**Keep the Tabler `IconGhostFilled` for now.** Here is why:

1. **It works.** A filled ghost silhouette is immediately recognizable, on-brand, and renders crisply at all sizes from favicon to header.

2. **Internal tool economics.** A custom brand mark for an internal-only tool is a vanity investment. The Tabler ghost icon costs zero, ships today, and is already implemented. Spend design budget on workflow improvements instead.

3. **The icon earns its power from scarcity.** If the ghost icon is the only red element, the only filled icon, and only appears in 2-3 places (header, login, favicon), it becomes a strong visual anchor without needing custom design.

4. **Future option.** If Ghost-Writer ever becomes a product sold externally, invest in a custom mark at that point. Until then, the Tabler icon with a red fill is the brand mark.

**Usage rules for the ghost icon:**
- Always OTF Red `#E21C1C` fill
- Always `IconGhostFilled` (filled variant), never outline
- Appears in: header (24px), login page (can go larger), favicon, and nowhere else in the functional UI
- Never animate it, spin it, or bounce it. Ghosts are still.
- Clear space: minimum 8px on all sides

---

## 4. Ghost Persona Guidelines

### The Principle: Ghost Is a Presence, Not a Character

Ghost is the name given to the system's operational voice. It is not a mascot, not an AI assistant, and not a chatbot. It is a way of attributing system actions to a named entity so that status messages feel grounded rather than impersonal.

Think of it as a byline, not a personality. "Ghost hit a snag" is better than "An error occurred" because it is specific, human-scale, and brand-consistent. But Ghost does not have opinions, make jokes, or express emotions.

### Where Ghost Speaks (Yes)

| Surface | Pattern | Example |
|---------|---------|---------|
| Dashboard greeting | "Ghost is ready." + context | "Ghost is ready. Pick up where you left off." |
| Empty states | "Ghost is [state]." + instruction | "Ghost is standing by. Add your first client to get started." |
| Error pages | "Ghost hit a snag." | "Ghost hit a snag. The team has been notified." |
| System status (idle) | "Ghost is [state]." | "No pending disputes. Ghost is caught up." |
| Admin empty states | "Ghost needs [thing]." | "Ghost needs templates to work with." |
| Verification/auth | "Ghost will [action]." | "Ghost will verify your identity via your social handle." |
| Template absence | "Ghost has no [thing]." | "Ghost has no templates to work with yet." |
| New signups (admin) | "Ghost will [action]." | "Ghost will surface new signups here for verification." |

### Where Ghost Does Not Speak (No)

| Surface | Why | What to Use Instead |
|---------|-----|-------------------|
| Button labels | Buttons are user actions, not Ghost actions | Verb + noun: "Add Client", "Generate Letter" |
| Form labels | Ghost is not asking questions | Standard label text: "First Name", "Account Number" |
| Table headers | Data labels, not persona territory | Standard column names |
| Validation errors | These are form feedback, not system status | "Required field" / "Invalid format" |
| Confirmation dialogs | User-initiated decisions | "This will clear all items. Continue?" |
| Success toasts for routine actions | Over-personification; the action speaking is enough | "Letter generated." / "Client saved." |
| Loading spinners | Ghost does not narrate its own work | "Working..." or no text |
| Navigation labels | Functional, not conversational | "Dashboard", "Clients", "Letter Library" |
| Tooltips | Instructional, not voiced | Standard help text |

### Ghost Persona Boundaries

**Ghost does not:**
- Use first person ("I'm working on it")
- Express emotions ("Ghost is excited to help!")
- Make jokes or puns ("Ghost-busting those disputes!")
- Apologize ("Ghost is sorry about that")
- Use exclamation marks
- Appear in more than one place per screen simultaneously
- Narrate routine operations that the user initiated

**Ghost does:**
- Speak in third person ("Ghost is ready")
- Use calm, declarative statements
- Appear at moments of transition (empty to populated, error to recovery, idle to active)
- Disappear once the user is engaged in a task

### Developing Ghost Further (Controlled Expansion)

The current Ghost persona touchpoints are well-placed. Here is the recommended expansion, in priority order:

**Phase 1 -- Already Done (keep as-is):**
- Dashboard greetings
- Empty states
- Error pages
- Onboarding/auth copy
- Admin empty states

**Phase 2 -- Recommended Additions:**
- **Post-generation confirmation:** "Ghost wrote [letter name] for [client]. Download ready." (replaces generic success toast)
- **Post-generation intelligence (when data exists):** "Ghost wrote Late Payment Removal for John Smith (Equifax). This template has removed 73% of items at Equifax."
- **Round advancement:** "Round [N] started. Ghost is ready for the next set of letters."
- **PII purge warning (when enabled):** "Ghost will purge [client name]'s data in [N] days."
- **Batch operation summary:** "Ghost created [N] dispute items across [N] bureaus."
- **Empty analytics state:** "Ghost is still waiting on outcomes. Results will appear as disputes resolve."

**Phase 3 -- Consider Later:**
- **First-time user onboarding tour:** Ghost as the narrator for a step-through guide
- **Keyboard shortcut hints:** "Ghost tip: Press Cmd+K to search clients." (only after the feature exists)

**Do Not Build:**
- Ghost avatar/face/character illustration
- Ghost animations, mascot, or stickers
- Ghost as an AI chatbot or assistant persona
- Ghost "mood" or "status" indicators
- Easter eggs, surprises, or playful interactions

---

## 5. Brand Consistency Checklist

### Every Screen Must Have

- [ ] **One h1 only** -- the page title, weight 900, -0.02em tracking
- [ ] **Ghost icon in header** -- OTF Red, 24px, `IconGhostFilled`
- [ ] **Satoshi font** -- loaded and applied to all text (fallback to system sans-serif)
- [ ] **4px default radius** -- on buttons, inputs, cards
- [ ] **Consistent neutral palette** -- `--bg-base` for page, `--bg-surface` for cards
- [ ] **No red primary buttons** -- all primary actions use the new action color
- [ ] **No ALL CAPS** except table headers and nav section labels

### Every Interaction Must Follow

- [ ] **Button labels are Verb + Noun** -- "Add Client", not "New" or "+"
- [ ] **Destructive actions are visually distinct** -- red variant button or `color="red"` on menu items
- [ ] **Loading states use neutral spinner** -- not red
- [ ] **Success feedback is understated** -- brief toast or inline confirmation, no celebrations
- [ ] **Error feedback names Ghost** -- "Ghost hit a snag" pattern
- [ ] **Empty states use the EmptyState component** -- icon (48px, muted) + title + description + optional action

### Every Empty State Must Follow

- [ ] **Uses `EmptyState` component** -- not inline text
- [ ] **Ghost persona in description** -- "Ghost is standing by..." / "Ghost is ready to..."
- [ ] **Has a clear action** -- button to resolve the empty state
- [ ] **Icon is 48px, color is `var(--text-muted)`**

### Color Application Rules

| Element | Color | Token |
|---------|-------|-------|
| Primary buttons | Slate Blue 600 | `--color-action-primary` |
| Primary button hover | Slate Blue 700 | `--color-action-hover` |
| Ghost brand icon | OTF Red 600 | `--color-red-primary` / `#E21C1C` |
| Error states | Rose `#E5484D` | `semantic.error` |
| Success states | Green `#10B981` | `semantic.success` |
| Warning states | Amber `#F59E0B` | `semantic.warning` |
| Info states | Sky `#0EA5E9` | `semantic.info` |
| Active nav link | Slate Blue | Mantine primary |
| Destructive actions | Mantine red variant | `color="red"` on component |
| Text primary | Mode-aware | `--text-primary` |
| Text secondary | Mode-aware | `--text-secondary` |
| Borders | Mode-aware | `--border-default` |

### What Changes When You Implement This

**In `colors.ts`:**
- Add `action` color scale (Slate Blue) alongside existing `red` scale
- Red scale stays exactly as-is (it is the brand signature)
- Comment on `red` changes from "Primary" to "Brand Signature"

**In `ghost-theme.ts`:**
- Change `primaryColor` from `'red'` to `'action'` (or whatever Mantine name you give the slate blue scale)
- Keep `red` in the colors object for explicit `color="red"` usage on destructive elements
- No other changes needed -- all component overrides work with any primary color

**In `variables.css`:**
- Rename `--color-red-primary` usage in `.focus-ring` to use the new action color
- Add `--color-action-primary` and `--color-action-hover` custom properties
- Keep `--color-red-primary` for the ghost icon and brand mark references

**In `AppShellLayout.tsx`:**
- Ghost icon keeps `color: 'var(--mantine-color-red-6)'` -- no change needed
- Login page title keeps its current styling -- no change needed

**In `page.tsx` (login):**
- Change `<Loader color="red" ...>` to `<Loader color="action" ...>` (or omit color to use primary)

**In `constants.ts`:**
- Equifax badge color changes from `'red'` to some other color (teal, indigo, etc.) to avoid confusion with brand red. This is a data accuracy issue: the Equifax brand color is actually maroon/burgundy, not fire-engine red.

---

## 6. Competitive Differentiation

### The Credit Repair Software Landscape

Most credit repair platforms (Credit Repair Cloud, DisputeBee, Client Dispute Manager) target the business owner who runs a credit repair company. They use consumer SaaS patterns: bright gradients, stock photos of happy families, testimonial carousels, pricing pages, "Start Your Free Trial" CTAs. Their brands scream "BUY ME."

Ghost-Writer competes with none of them because it is not a product for sale. It is an internal tool. This is the brand's greatest strategic advantage: **it does not need to sell.**

### What This Means for Brand

- **No marketing language in the UI.** The tool never needs to persuade, upsell, or convert. Every word can be functional.
- **No feature announcements or changelog modals.** If a feature exists, it is in the nav. If it is new, the team knows because they asked for it.
- **No onboarding tours for features the user already understands.** Credit repair professionals know what a dispute letter is. The tool should assume competence.
- **No competitive positioning inside the product.** No "powered by" badges, no "better than" comparisons, no "trusted by X users" social proof. The tool is trusted because it works.
- **Density over delight.** Internal tools should prioritize information density and workflow speed over visual polish. A beautiful empty state matters less than being able to generate 20 letters in 10 minutes.

### The Ghost-Writer Difference (Expressed Through Brand)

| Competitors | Ghost-Writer |
|-------------|-------------|
| Bright, attention-seeking UI | Muted, professional, stays out of the way |
| Consumer onboarding flows | Assumed competence, minimal hand-holding |
| Feature marketing inside the product | Features exist or they do not |
| Generic document generation | Domain-specific dispute letter automation |
| Data stored indefinitely | PII-conscious with purge capabilities |
| "Your success is our success!" | "Ghost is ready." |

---

## 7. Intelligence Layer: Ghost as a Learning System

Ghost-Writer is not just a generation engine. It is a system that learns from its own output. Every letter generated, every status updated, every round advanced feeds a dataset that makes the next decision better. This is Ghost-Writer's compounding advantage -- the more it is used, the more valuable it becomes.

The intelligence layer must be visible but never loud. Ghost presents facts, not opinions. "73% success rate" is a data point. "This template is performing well" is an editorial that Ghost should never make.

### What Exists Today

**Data captured:**
- `generationLogs` records every letter generation (client, user, template, linked dispute items)
- `disputeItems` tracks status (`pending` / `removed` / `verified`) and `currentRound`
- `auditLogs` maintains a full action trail

**Analytics computed (backend):**
- `getLetterAnalytics` -- per-template: total downloads, unique users, success rate, last used
- `getLetterStats` -- aggregate: total letters, downloads this month, average success rate

**Analytics surfaced (frontend):**
- Admin dashboard only: 4 stat cards + sortable letter analytics table
- Team members see zero intelligence data -- they generate letters without any signal about template performance

### Where Intelligence Should Be Surfaced

#### Tier 1: Surface Existing Data to Team Members

**A. Template selection cards (highest-leverage touchpoint)**

When `LetterSelectionModal` opens, each template card should show success rate and usage count alongside the title and applicable CRAs:

```
Late Payment Removal Request
Equifax · TransUnion · Experian
73% success rate · Used 48 times
```

If no outcome data exists yet:

```
Medical Debt Validation
Equifax
No outcome data yet
```

Ghost does not recommend. It shows numbers. The practitioner decides.

**B. Per-client removal rate on ClientInfoCard**

A stat row beneath the client contact info showing dispute progress:

```
8 items total · 5 removed · 2 pending · 1 verified
62% removal rate
```

This is computed from existing `disputeItems` data already fetched on the client detail page. No new backend query needed.

**C. Portfolio success rate on team dashboard**

A new stat card alongside Total Clients and Pending Items:

```
Portfolio Success Rate
62%
Items removed across all clients
```

One number that tells the practitioner how they are doing. Informative, not celebratory.

#### Tier 2: Slice Data for Actionable Insight

**D. Per-CRA success rates in admin analytics**

The current `LetterAnalyticsTable` shows one success rate per template. A template may perform at 80% against Experian and 40% against Equifax. Break success rate by CRA in an expandable row or additional columns. The data exists in `disputeItems.craTarget` -- it needs grouping during computation.

**E. Per-dispute-type analytics**

Which dispute types resolve most often? This informs where the admin should invest in template improvement:

```
Late Payment       72%   (89 items)
Collection         58%   (63 items)
Medical            45%   (31 items)
Identity Theft     33%   (12 items)
```

**F. Round-level insight**

Which round typically succeeds? If 60% of removals happen in round 1 and only 15% in round 3+, that informs practitioner strategy. The `currentRound` field is already tracked -- correlate it with status outcomes.

### Intelligence Layer Voice Guidelines

Ghost's voice on intelligence surfaces follows the same rules as everywhere else, with one addition: **Ghost states facts about its own track record without editorializing.**

| Surface | Ghost says | Ghost does not say |
|---------|-----------|-------------------|
| Template with data | "73% success rate · Used 48 times" | "Recommended" / "Top performer" |
| Template without data | "No outcome data yet" | "Try this one!" |
| Client progress | "5 of 8 items removed" | "Great progress!" |
| Empty analytics | "Ghost is still waiting on outcomes." | "Check back later!" |
| Round insight | "Round 1: 58% removal rate" | "Round 1 works best" |

### Intelligence Layer Boundaries

- **No recommendations or rankings.** Ghost informs; it does not prescribe.
- **No gamification.** No leaderboards, streaks, or achievement badges.
- **No team member comparisons.** Portfolio success rate is personal. Peer comparison introduces competition where collaboration is needed.
- **No blocking.** Intelligence data should be available at decision points but never required before taking action.
- **No editorializing.** Numbers only. Let the practitioner draw conclusions.

---

## 8. Implementation Priority

### Immediate (Before Next Feature Sprint)

1. **Add Slate Blue color scale to `colors.ts`** and wire it as `primaryColor` in `ghost-theme.ts`
2. **Change `<Loader color="red">` instances** to use the new primary color (3 instances in `page.tsx`)
3. **Update `.focus-ring` in `variables.css`** to use new action color
4. **Change Equifax badge color** in `constants.ts` from `'red'` to a distinct color

### Short-Term (Next 1-2 Sprints)

5. **Audit all `color="red"` prop usage** across components -- keep for destructive actions, change to primary for non-destructive actions
6. **Update pending user badge** in `NavLinks.tsx` from `color="red"` to primary (pending is not an error)
7. **Add Ghost persona copy** to Phase 2 touchpoints (post-generation confirmation, round advancement)

### Track and Maintain

8. **Brand consistency review** every 2 sprints -- check new components against this document
9. **Copy review** for new features -- ensure Ghost persona guidelines are followed
10. **Color audit** when adding new features -- no new red usage except for the brand mark

---

## 9. Engineering Team: Intelligence Layer Implementation

The following items require engineering work (new queries, backend computation, data wiring, UI integration) to bring the intelligence layer described in Section 7 into the product.

### Tier 1: Surface Existing Data to Team Members

| # | Item | Details | Effort |
|---|------|---------|--------|
| I1 | **Success rate + usage count on template selection cards** | Create a team-accessible query (lighter than `getLetterAnalytics`) that returns per-template success rate and usage count. Consume in `LetterSelectionModal` to display "73% success rate · Used 48 times" on each template card. Show "No outcome data yet" when no resolved disputes exist for a template. | Small -- new query + frontend display |
| I2 | **Per-client removal rate on ClientInfoCard** | Compute removal stats from the `disputeItems` array already fetched on the client detail page. Display "N of M items removed · X% removal rate" below client contact info. No new backend query needed -- frontend math only. | Tiny -- frontend only |
| I3 | **Portfolio success rate stat card on team dashboard** | New query that computes aggregate removal rate across all of a team member's clients' dispute items. Add stat card to `TeamDashboard.tsx` alongside Total Clients and Pending Items. | Small -- new query + stat card |

### Tier 2: Slice Data for Actionable Insight (Admin)

| # | Item | Details | Effort |
|---|------|---------|--------|
| I4 | **Per-CRA success rate breakdown in admin analytics** | Extend `getLetterAnalytics` (or create a companion query) to group success rates by `craTarget`. Surface in `LetterAnalyticsTable` as expandable rows or additional columns. | Medium -- backend grouping + UI |
| I5 | **Dispute type performance view** | New query that aggregates removal rates by `disputeType` across all dispute items. Display as a simple table or bar visualization on the admin dashboard. | Medium -- new query + new UI section |
| I6 | **Round-level success correlation** | Correlate `currentRound` with `status` outcomes. Surface as a summary (e.g., "Round 1: 58% removal · Round 2: 34% · Round 3+: 18%") in admin analytics. | Medium -- new query |

### Ghost Persona Copy Updates

| # | Item | Details | Effort |
|---|------|---------|--------|
| I7 | **Post-generation confirmation with intelligence** | Replace generic success toasts in the letter generation flow with Ghost-voiced confirmation: "Ghost wrote [letter] for [client] ([CRA]). Download ready." When success rate data exists for that template + CRA, append: "This template has removed X% of items at [CRA]." | Tiny -- copy changes + conditional display |
| I8 | **Round advancement copy** | Update the notification in `ClientDisputesTable.handleAdvanceRound` from "Dispute moved to next round" to "Round [N] started. Ghost is ready for the next letter." | Tiny -- copy change |
| I9 | **Batch operation summary copy** | Update the success notification in `DisputeItemModal.handleSubmit` to "Ghost created [N] dispute items across [N] bureaus." | Tiny -- copy change |
| I10 | **Empty analytics state copy** | When a template has generations but zero resolved outcomes, show "Ghost is still waiting on outcomes. Results will appear as disputes resolve." instead of "—" or null. | Tiny -- conditional copy |

### Implementation Notes

- **Priority order:** I1 through I3 first (small effort, immediate value to team members), then I7 through I10 (copy changes, brand consistency), then I4 through I6 (deeper analytics for admins).
- **I1 is the highest-leverage item.** The template selection moment is where practitioners make their most consequential decision. Giving them success rate data at that exact point directly serves the goal of making users the best in the game.
- **I2 requires zero backend work.** The `disputeItems` array is already fetched on the client detail page. This is pure frontend math.
- **I7 through I10 are copy changes only.** No new data fetching, just updating notification messages to use Ghost's voice and include contextual information already available in scope.

---

## Appendix A: Existing Ghost Persona Copy Inventory

Current Ghost-voiced copy across the application, confirmed as brand-consistent:

| File | Copy | Context |
|------|------|---------|
| `TeamDashboard.tsx` | "Ghost is ready. Pick up where you left off." | Dashboard greeting |
| `AdminDashboard.tsx` | "Ghost is ready. Manage templates and monitor the team." | Admin dashboard greeting |
| `TeamDashboard.tsx` | "Ghost is standing by. Add your first client to get started." | Empty state |
| `clients/page.tsx` | "Ghost is standing by. Add your first client to get started." | Clients empty state |
| `clients/[id]/page.tsx` | "Ghost is ready to write. Add a dispute to start generating letters." | Client detail empty state |
| `AdminDashboard.tsx` | "Ghost needs templates to work with. Create your first letter to get started." | Admin empty state |
| `ClientsTable.tsx` | "No pending disputes. Ghost is caught up." | Filtered empty state |
| `LetterSelectionModal.tsx` | "Ghost has no templates to work with yet. Ask an admin to create one." | Template empty state |
| `UsersTabs.tsx` | "All clear. Ghost will surface new signups here for verification." | Admin users empty state |
| `OnboardingForm.tsx` | "Ghost will use this to verify your identity" | Form field description |
| `waiting-room/page.tsx` | "Ghost will verify your identity via your social handle" | Waiting room status |
| `global-error.tsx` | "Ghost hit a snag" | Global error page |
| `generate/error.tsx` | "Ghost hit a snag" | Generate error page |

All entries follow the established patterns. No corrections needed.

---

**Brand Guardian:** Claude (Brand Strategy Agent)
**Session Dates:** March 21-22, 2026
**Implementation:** Color migration ready for engineering. Intelligence layer spec ready for engineering (Section 9).
**Next Review:** After color system migration and Tier 1 intelligence items (I1-I3) are complete

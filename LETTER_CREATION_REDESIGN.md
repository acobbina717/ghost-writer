# Letter Creation Redesign — Implementation Spec

> **Status:** Approved for engineering  
> **Date:** March 24, 2026  
> **Scope:** Admin letter template creation, team member dispute generation, data model changes  
> **CRA Scope:** Experian, Equifax, TransUnion only (Early Warning, ChexSystems, LexisNexis deferred to future phase)

---

## 1. Goals

- Simplify the admin letter creation UI from 4 sections to 2
- Remove the Custom Form Fields (JSON schema) concept entirely
- Replace the monolithic `{{client_info_block}}` tag with individual client info smart tags
- Support dispute-type-specific item fields (Inquiry, Late Payment, Account-Based)
- Add a repeating "Dispute Items Section" block in the editor with full admin control over item layout
- Reorder the team member generation flow so template selection happens before dispute item entry
- Enforce schema-group compatibility when a letter claims multiple dispute types

---

## 2. Dispute Item Schema Groups

Three schema groups define which fields a dispute item can have. These are hardcoded constants shared between frontend and backend.

### Schema Definitions

```
INQUIRY
  Types: Inquiry
  Fields:
    - creditorName    "Company/Furnisher Name"     required
    - inquiryDate     "Date of Inquiry"            required

LATE PAYMENT
  Types: Late Payment
  Fields:
    - creditorName    "Account/Furnisher Name"     required
    - monthsLate      "Months Late"                required    select: 30, 60, 90, 120
    - monthLate       "Month Late"                 required    placeholder: 03/2022

ACCOUNT-BASED
  Types: Collection, Charge-off, Repossession, Foreclosure, Medical, Bankruptcy
  Fields:
    - creditorName    "Account/Furnisher Name"     required
    - accountNumber   "Account Number"             optional
    - dateOpened      "Date Opened"                optional
    - balance         "Balance"                    optional
```

### Usage

This single definition drives:
- **Editor sidebar** — which per-item smart tags appear when cursor is inside the dispute block
- **Mutation validation** — which fields are expected/required when creating dispute items
- **Generation form** — which inputs the team member sees at step 4
- **Multi-type enforcement** — a letter can only be tagged with multiple dispute types if they belong to the same schema group

### Multi-Type Enforcement

When the admin selects a dispute type in the Letter Settings multi-select, the remaining options filter down to only types within the same schema group. Example: selecting "Collection" makes "Charge-off", "Repossession", "Foreclosure", "Medical", and "Bankruptcy" available but removes "Inquiry" and "Late Payment" from the dropdown.

---

## 3. Data Model Changes

### `disputeItems` table — Add type-specific fields (flat optional columns)

```
disputeItems:
  clientId          id("clients")
  disputeType       string
  craTarget         string
  currentRound      number
  status            "pending" | "removed" | "verified"
  createdAt         number
  updatedAt         number
  creditorName      optional string          (all types)
  inquiryDate       optional string          (Inquiry)
  accountNumber     optional string          (Account-Based)
  dateOpened        optional string          (Account-Based)
  balance           optional string          (Account-Based)
  monthsLate        optional string          (Late Payment — "30"|"60"|"90"|"120")
  monthLate         optional string          (Late Payment — "03/2022")
```

Server-side mutations validate that the correct fields are present based on the dispute type's schema group. Fields outside the type's schema are rejected.

### `letters` table — Remove fields

```
letters:
  title             string
  content           string                   (HTML with repeating block markers)
  disputeTypes      array of string
  applicableCRAs    array of string
  maxDisputeItems   optional number
  createdAt         number
  updatedAt         number

  REMOVED: formSchema
  REMOVED: clientInfoFields
```

The `formFieldValidator` at the top of `schema.ts` can be removed.

### `generationLogs` table — Remove `formAnswers`

```
generationLogs:
  clientId          id("clients")
  userId            id("users")
  letterId          id("letters")
  disputeItemIds    array of id("disputeItems")
  status            "pending" | "removed" | "verified"
  createdAt         number

  REMOVED: formAnswers
```

### Migration Notes

- Existing letters using `{{client_info_block}}` — keep backward-compatible handling in `hydrateTemplate` during a transition period. The old `hydrateClientInfoBlock` function and `CLIENT_INFO_FIELD_OPTIONS` can remain until all existing templates are updated.
- Existing letters with `formSchema` — the field is removed from the schema. Any letters that had custom form tags in their content will show those tags as unresolved. Admin should update these templates.
- Existing `disputeItems` rows are unaffected — they already have `creditorName`, `accountNumber`, and `inquiryDate` as optional fields. New fields (`dateOpened`, `balance`, `monthsLate`, `monthLate`) will only appear on newly created items.

---

## 4. Admin — Create/Edit Letter UI

### Layout: 2 Sections

The `LetterForm` component renders two `Paper` sections inside a `Stack`:

**Section 1: Letter Settings**
- Title (TextInput, required)
- Dispute Types (MultiSelect, required, filtered by schema group after first selection)
- Applicable CRAs (MultiSelect, required, Big 3 only for now)
- Max Dispute Items (NumberInput, optional, 1–20)

**Section 2: Letter Content**
- TiptapEditor with SmartTagsSidebar
- Preview Letter button (opens modal with sample data and "Sample Letter" watermark)

**Removed sections:**
- Client Info Block (checkbox grid) — replaced by individual smart tags
- Custom Form Fields (FormSchemaInput JSON textarea) — removed entirely

**Removed components:**
- `FormSchemaInput` — no longer needed
- `DynamicForm` and `validateDynamicForm` — no longer needed at generation time

### Header Actions

- Cancel (navigates back to `/admin/letters`)
- Save/Create button
- Bottom action bar removed (single action area at top)

---

## 5. Smart Tags Sidebar

### Context-Aware Behavior

The sidebar content changes based on cursor position within the editor.

### When cursor is OUTSIDE the dispute block

```
SMART TAGS
Click to insert at cursor
─────────────────────────
CLIENT INFO
  {{client_name}}         Full Name
  {{first_name}}          First Name
  {{last_name}}           Last Name
  {{client_address}}      Mailing Address
  {{client_ssn}}          SSN (masked)
  {{client_dob}}          Date of Birth
  {{client_email}}        Email Address
  {{client_phone}}        Phone Number
─────────────────────────
SYSTEM
  {{current_date}}        Today's Date
─────────────────────────
DISPUTE ITEMS
  [Insert Dispute Items Section]    ← button
```

If the dispute block already exists in the document, the button is disabled with tooltip: "Already added."

### When cursor is INSIDE the dispute block

The "Dispute Item Fields" category appears at the top. The fields shown are driven by the letter's selected dispute type schema group.

Example for Account-Based (Collection, Charge-off, etc.):

```
SMART TAGS
Click to insert at cursor
─────────────────────────
DISPUTE ITEM FIELDS
  {{item_number}}              Item # (auto-numbers: 1, 2, 3…)
  {{item_creditor_name}}       Account/Furnisher Name
  {{item_account_number}}      Account Number
  {{item_date_opened}}         Date Opened
  {{item_balance}}             Balance
─────────────────────────
CLIENT INFO
  (same as above)
─────────────────────────
SYSTEM
  {{current_date}}        Today's Date
```

Example for Late Payment:

```
DISPUTE ITEM FIELDS
  {{item_number}}              Item #
  {{item_creditor_name}}       Account/Furnisher Name
  {{item_months_late}}         Months Late
  {{item_month_late}}          Month Late
```

### Tags Removed

- `{{client_info_block}}` — replaced by individual client tags above
- `{{current_round}}` — removed
- `{{creditor_name}}` — legacy single-item tag, replaced by `{{item_creditor_name}}`
- `{{account_number}}` — legacy single-item tag, replaced by `{{item_account_number}}`
- Custom field tags (`{{tagId}}`) — removed with the custom fields concept

---

## 6. Dispute Items Section Block — Tiptap Custom Node

### Overview

A block-level Tiptap node extension called `disputeItemsBlock`. The admin inserts it from the sidebar. It acts as a container (like a blockquote) where the admin defines what ONE dispute item looks like. At render time, the content is repeated for each item.

### Visual Treatment in Editor

- **Left border:** 2px solid, muted accent color (e.g., violet)
- **Label:** Non-editable, small uppercase dimmed text above content: `REPEATS FOR EACH DISPUTE ITEM`
- **Background:** Subtle tint (5–8% opacity of border color)
- **Placeholder:** When empty, show hint text: "Add dispute item fields here using the smart tags sidebar"

### Constraints

| Rule | Detail |
|---|---|
| One per letter | Button disables after insertion. No duplicate blocks. |
| Deletable | Admin can select and delete the block. Some letters may not need items. |
| No nesting | Block cannot contain another dispute block. |
| Per-item tags outside block | Tags like `{{item_creditor_name}}` placed outside the block will appear as unresolved in the preview (existing "Unresolved tags detected" warning). |

### Serialization (Editor → HTML for storage)

The node's `renderHTML` method outputs HTML comment markers:

```html
<p>I am disputing the following items:</p>
<!--dispute_block_start-->
<p><strong>{{item_number}}. {{item_creditor_name}}</strong></p>
<p>Account #: {{item_account_number}}</p>
<!--dispute_block_end-->
<p>Please investigate these items.</p>
```

### Parsing (HTML → Editor on load)

The node's `parseHTML` method recognizes content between `<!--dispute_block_start-->` and `<!--dispute_block_end-->` and reconstructs the custom node with its visual treatment.

---

## 7. Hydration — Template Rendering

### Two-Pass Process

The `hydrateTemplate` function processes the template in two passes:

**Pass 1 — Expand the repeating block:**

1. Locate content between `<!--dispute_block_start-->` and `<!--dispute_block_end-->`
2. If no markers found, skip to Pass 2 (letter has no dispute items section)
3. If markers found but no dispute items provided, remove the entire marker region (no empty container)
4. For each dispute item:
   - Clone the block HTML
   - Replace `{{item_number}}` with the 1-based index
   - Replace per-item field tags (`{{item_creditor_name}}`, etc.) with the item's data
5. Join expanded blocks with line break spacing
6. Replace the entire marker region (markers included) with the joined output

**Pass 2 — Replace global tags:**

7. Replace client info tags: `{{client_name}}`, `{{first_name}}`, `{{last_name}}`, `{{client_address}}`, `{{client_ssn}}`, `{{client_dob}}`, `{{client_email}}`, `{{client_phone}}`
8. Replace system tags: `{{current_date}}`

### New Tags to Add to Hydration

| Tag | Value | Context |
|---|---|---|
| `{{client_dob}}` | `data.dateOfBirth` | Global |
| `{{client_email}}` | `data.email` | Global |
| `{{client_phone}}` | `data.phone` | Global |
| `{{item_number}}` | 1-based index | Per-item (inside block) |
| `{{item_creditor_name}}` | `item.creditorName` | Per-item |
| `{{item_inquiry_date}}` | `item.inquiryDate` | Per-item (Inquiry) |
| `{{item_account_number}}` | `item.accountNumber` | Per-item (Account-Based) |
| `{{item_date_opened}}` | `item.dateOpened` | Per-item (Account-Based) |
| `{{item_balance}}` | `item.balance` | Per-item (Account-Based) |
| `{{item_months_late}}` | `item.monthsLate` | Per-item (Late Payment) |
| `{{item_month_late}}` | `item.monthLate` | Per-item (Late Payment) |

### Tags Removed from Hydration

- `{{client_info_block}}` — removed (keep backward-compat during transition)
- `{{current_round}}` — removed
- `{{dispute_items_list}}` — replaced by the block expansion above
- `{{creditor_name}}` — legacy single-item tag
- `{{account_number}}` — legacy single-item tag
- Dynamic form answer tags — removed with custom fields

### Hydration Data Interface Update

```
HydrationData:
  firstName         string
  lastName          string
  address1          string
  address2          optional string
  city              string
  state             string
  zipCode           string
  last4SSN          string
  email             optional string
  phone             optional string
  dateOfBirth       optional string
  disputeType       string
  disputeItems      optional array of DisputeItemData

  REMOVED: currentRound
  REMOVED: creditorName (single-item legacy)
  REMOVED: accountNumber (single-item legacy)
  REMOVED: clientInfoFields
  REMOVED: formAnswers
```

```
DisputeItemData:
  creditorName      optional string
  inquiryDate       optional string
  accountNumber     optional string
  dateOpened        optional string
  balance           optional string
  monthsLate        optional string
  monthLate         optional string
```

---

## 8. Admin Preview

When the admin clicks "Preview Letter" in the editor:

- Sample data is used (fake client: "Jane Sample", "123 Example St, Anytown, NY 10001")
- 2–3 sample dispute items are generated based on the letter's dispute type schema
- The repeating block expands to show the items so the admin can verify the repeated layout
- A diagonal **"Sample Letter"** watermark is overlaid on the preview iframe (light gray, ~45°, centered)

---

## 9. Team Member — Generate Letter Flow

### Reordered 5-Step Flow

| Step | What the Team Member Does |
|---|---|
| **1. Dispute Type** | Select from types that have at least one template. |
| **2. CRAs** | Chip selection. Auto-selects for single-CRA types. |
| **3. Template** | Browse available templates for the selected type + CRA combo. Single-CRA sample preview with "Sample Letter" watermark. Select a template to continue. |
| **4. Dispute Items** | Add items. Form fields are dynamically rendered based on the dispute type's schema group. Shared items by default; "Customize per CRA" toggle for multi-CRA. |
| **5. Live Preview + Download** | Real data hydrated into the template. Per-CRA segmented control for previewing. Download per CRA or "Download All." |

### Step 3 Detail — Template Browser

- Shows all templates matching the dispute type AND at least one selected CRA
- Each template card shows: title, CRA badges, template stats (success rate, usage count)
- Single preview pane showing the selected template with sample data and watermark
- Preview uses one CRA only (whichever is selected first) — sufficient for evaluating template structure
- "Select" or clicking the template card advances to step 4

### Step 4 Detail — Dynamic Dispute Item Form

The form fields rendered for each item are driven by the schema group constants:

- **Inquiry:** Company/Furnisher Name (text), Date of Inquiry (text)
- **Late Payment:** Account/Furnisher Name (text), Months Late (select: 30/60/90/120), Month Late (text, placeholder: 03/2022)
- **Account-Based:** Account/Furnisher Name (text), Account Number (text, optional), Date Opened (text, optional), Balance (text, optional)

No more `isInquiry` boolean branching. The schema definition drives the form entirely.

### Removed from Generation Flow

- Custom fields / DynamicForm step — removed
- `formAnswers` — not collected or stored

---

## 10. Files Affected

### Components to Modify

- `src/app/(authenticated)/admin/letters/LetterForm.tsx` — Simplify to 2 sections, remove Client Info Block and Custom Form Fields
- `src/components/TiptapEditor/TiptapEditor.tsx` — Register dispute items block node extension
- `src/components/TiptapEditor/SmartTagsSidebar.tsx` — Context-aware tags, add client info tags, add per-item tags, remove custom tags
- `src/app/(authenticated)/clients/[id]/DisputeGenerateModal.tsx` — Reorder steps (template before items), dynamic item form fields, remove DynamicForm usage
- `src/lib/hydrateTemplate.ts` — Two-pass hydration, block expansion, new tags, remove legacy tags
- `src/lib/pdf-utils.ts` — Add "Sample Letter" watermark support for preview
- `convex/schema.ts` — Update disputeItems fields, remove formSchema/clientInfoFields from letters, remove formAnswers from generationLogs, remove formFieldValidator
- `convex/constants.ts` — Add DISPUTE_ITEM_SCHEMAS definition
- `convex/letters.ts` — Update create/update mutations (remove formSchema/clientInfoFields validation, add schema group validation for multi-type)
- `convex/clients.ts` — Update createDisputeItems mutation for new field structure with schema validation
- `src/lib/convex-types.ts` — Update types to reflect schema changes

### Components to Remove

- `src/components/TiptapEditor/FormSchemaInput.tsx` (or `.ts`) — Custom form field JSON editor
- `src/components/DynamicForm/DynamicForm.tsx` — Dynamic form renderer and validator

### New Files

- Tiptap node extension for `disputeItemsBlock` (likely `src/components/TiptapEditor/extensions/DisputeItemsBlock.ts` or similar)

---

## 11. Out of Scope (Future)

- Early Warning, ChexSystems, LexisNexis letter formats
- Admin-configurable dispute type schemas (currently hardcoded constants)
- Any changes to the clients table or client profile page
- Analytics/reporting changes related to the removed `formAnswers` field

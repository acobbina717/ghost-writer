# Feature: Repeating Dispute Items in Letter Templates

**Date**: 2026-03-21
**Status**: Planning

---

## Overview

Letter templates need to support multiple dispute items within a single letter. An admin places a single `{{dispute_items}}` tag in the template editor, and the system handles rendering 1–N items with proper formatting in both the preview and PDF output.

---

## How It Works

### Admin Experience (Template Creation)

1. Admin creates a letter template in the TipTap editor
2. Admin writes the letter body and places a single `{{dispute_items}}` tag where the items should appear
3. Admin defines the item fields via the form schema builder — selecting which fields each item should collect for this specific letter type
4. The form schema stores a `"repeat"` field type with nested field definitions

Example template content:

> Dear Equifax,
>
> I am writing to dispute the following items on my credit report:
>
> {{dispute_items}}
>
> Please investigate and correct these errors within 30 days.

### Team Member Experience (Letter Generation)

1. Team member selects a letter template for a client's dispute
2. The dynamic form renders single-value fields as usual (client name, date, etc.)
3. For the `{{dispute_items}}` field, the form renders a repeatable item group with add/remove controls
4. Team member adds 1–N items, filling in the fields defined by the admin for each item
5. Preview shows all items formatted inline in the letter
6. PDF generates with the items properly laid out

### System Behavior (Hydration + PDF)

1. `hydrateTemplate` replaces single-value `{{tags}}` as usual
2. When it encounters `{{dispute_items}}`, it reads the corresponding array from `formAnswers`
3. It dynamically generates an HTML block (styled table or structured list) from the array data
4. The HTML structure is derived from the form schema's field definitions (labels become headers/labels, values fill in)
5. The expanded HTML replaces the `{{dispute_items}}` tag
6. PDF renderer receives flat HTML — no special handling needed

---

## Data Structures

### Form Schema (Per-Template, Defined by Admin)

The form schema's `fields` array gains a new `"repeat"` type:

```typescript
// Single-value field (existing)
{
  type: "text",
  label: "Hospital Name",
  tagId: "hospital_name"
}

// Repeatable item group (new)
{
  type: "repeat",
  tagId: "dispute_items",
  label: "Dispute Items",
  minItems: 1,
  maxItems: 5,
  fields: [
    { type: "text", label: "Creditor Name", tagId: "creditor_name" },
    { type: "text", label: "Account Number", tagId: "account_number" },
    { type: "textarea", label: "Reason for Dispute", tagId: "reason" }
  ]
}
```

### Form Answers (Submitted by Team Member)

```typescript
{
  // Single-value answers (existing)
  client_name: "John Doe",
  dispute_date: "2026-03-21",

  // Repeatable item answers (new)
  dispute_items: [
    {
      creditor_name: "Chase",
      account_number: "****1234",
      reason: "Account does not belong to me"
    },
    {
      creditor_name: "Capital One",
      account_number: "****5678",
      reason: "Balance was paid in full on 01/15/2026"
    },
    {
      creditor_name: "Midland Credit",
      account_number: "****9012",
      reason: "Debt is past the statute of limitations"
    }
  ]
}
```

### Hydrated HTML Output

The `{{dispute_items}}` tag is replaced with a formatted HTML block:

```html
<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr>
      <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ccc;">Creditor Name</th>
      <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ccc;">Account Number</th>
      <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ccc;">Reason for Dispute</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">Chase</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">****1234</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">Account does not belong to me</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">Capital One</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">****5678</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">Balance was paid in full on 01/15/2026</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">Midland Credit</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">****9012</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">Debt is past the statute of limitations</td>
    </tr>
  </tbody>
</table>
```

---

## Example Letter Types and Their Item Fields

### Medical Debt Dispute

```typescript
{
  type: "repeat",
  tagId: "dispute_items",
  label: "Medical Accounts",
  maxItems: 5,
  fields: [
    { type: "text", label: "Hospital/Provider", tagId: "provider_name" },
    { type: "text", label: "Account Number", tagId: "account_number" },
    { type: "date", label: "Date of Service", tagId: "service_date" },
    { type: "text", label: "Amount", tagId: "amount" }
  ]
}
```

### Collections Dispute

```typescript
{
  type: "repeat",
  tagId: "dispute_items",
  label: "Collection Accounts",
  maxItems: 5,
  fields: [
    { type: "text", label: "Original Creditor", tagId: "original_creditor" },
    { type: "text", label: "Collection Agency", tagId: "collection_agency" },
    { type: "text", label: "Account Number", tagId: "account_number" },
    { type: "text", label: "Reason", tagId: "reason" }
  ]
}
```

### Late Payment Dispute

```typescript
{
  type: "repeat",
  tagId: "dispute_items",
  label: "Late Payment Accounts",
  maxItems: 5,
  fields: [
    { type: "text", label: "Creditor Name", tagId: "creditor_name" },
    { type: "text", label: "Account Number", tagId: "account_number" },
    { type: "date", label: "Date Reported Late", tagId: "late_date" },
    { type: "text", label: "Explanation", tagId: "explanation" }
  ]
}
```

### Charge-Off / General Dispute

```typescript
{
  type: "repeat",
  tagId: "dispute_items",
  label: "Disputed Accounts",
  maxItems: 5,
  fields: [
    { type: "text", label: "Creditor Name", tagId: "creditor_name" },
    { type: "text", label: "Account Number", tagId: "account_number" },
    { type: "text", label: "Amount", tagId: "amount" },
    { type: "textarea", label: "Reason for Dispute", tagId: "reason" }
  ]
}
```

---

## Implementation Touchpoints

### 1. Form Schema Builder (`FormSchemaInput.tsx`)

- Add ability to create a `"repeat"` field type
- UI for adding/removing/reordering nested fields within the repeat group
- Set `minItems` and `maxItems` constraints

### 2. Dynamic Form (`DynamicForm.tsx`)

- Detect `type: "repeat"` in the schema
- Render an add/remove item list (similar to existing `CraCustomizationStep` pattern)
- Each item renders the nested fields defined in the repeat group
- Enforce `minItems`/`maxItems` constraints
- Store answers as an array of objects under the repeat group's `tagId`

### 3. Template Hydration (`hydrateTemplate.ts`)

- When replacing `{{dispute_items}}` (or any tag whose formAnswers value is an array), generate an HTML table/list from the array
- Use the form schema's field definitions to determine column headers/labels
- HTML-escape all values before insertion (addresses the security finding)
- Pass the form schema into the hydration function so it knows the field labels

### 4. Convex Schema (`convex/schema.ts`)

- The `formSchema` field on the `letters` table needs to support the nested repeat structure
- Replace `v.any()` with a typed validator that includes the repeat type (addresses the audit finding)
- The `formAnswers` field on `generationLogs` needs to support array values

### 5. Preview Page

- No changes needed — preview renders the hydrated HTML, which already includes the expanded items

### 6. PDF Generation (`convex/pdf.ts`)

- No changes needed — receives fully hydrated HTML with items already expanded

---

## Constraints

- Maximum 5 items per repeat group (configurable per template via `maxItems`)
- Minimum 1 item per repeat group by default
- One repeat group per template (a single `{{dispute_items}}` tag)
- Field types within repeat groups support: `text`, `date`, `textarea`, `select`
- All values are HTML-escaped during hydration

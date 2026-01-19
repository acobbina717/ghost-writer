# Ghost-Writer

**Credit Repair Automation Platform**

An internal automation hub for generating high-fidelity, professional credit dispute letters for Credit Reporting Agencies (CRAs). Ghost-Writer replaces manual copy-paste workflows with a structured, form-driven system that ensures formatting fidelity and data security.

[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Convex](https://img.shields.io/badge/Convex-Database-orange?style=flat)](https://convex.dev)
[![Mantine UI](https://img.shields.io/badge/Mantine-UI-339af0?style=flat)](https://mantine.dev)

---

## Overview

Ghost-Writer transforms the credit dispute workflow by eliminating manual data entry and formatting errors. The platform enables credit repair teams to:

- **Digitize Legal Templates**: Store letter templates with dynamic smart tags
- **Automate Data Entry**: Merge client data, dispute details, and custom fields automatically
- **Generate Professional PDFs**: Produce professionally formatted letters with one click
- **Track Success Rates**: Monitor dispute outcomes at the individual item level

### User Roles
- **Admin**: Full access to create/edit letter templates and manage team members
- **Team Members**: Generate letters for their assigned clients
- **Pending Users**: New signups awaiting manual verification

---

## Core Features

- **Role-Based Access Control**: Admin, Team, and Pending user tiers with manual approval workflow
- **Rich Text Letter Editor**: Smart tag system with dynamic fields like `{{client_name}}` and `{{client_address}}`
- **Custom Form Schemas**: Define letter-specific input fields without code changes
- **Client & Dispute Management**: Track individual disputes per CRA with round counters and status tracking
- **Professional PDF Generation**: One-click export with formatting fidelity and ephemeral storage
- **Team Dashboard**: Expandable client table with dispute counts and days-active tracking
- **Admin Analytics**: Letter usage statistics, success rates, and audit logging
- **Data Lifecycle Tracking**: Days-active monitoring for informational purposes *(auto-purge feature planned)*

---

## Tech Stack

**Frontend:** [Next.js](https://nextjs.org) (App Router), [Mantine UI](https://mantine.dev), [TanStack Table](https://tanstack.com/table), [Tiptap](https://tiptap.dev), CSS Modules  
**Backend:** [Convex](https://convex.dev) (Database), [Clerk](https://clerk.com) (Auth), [Browserless.io](https://browserless.io) (PDF Generation)  
**Infrastructure:** [Vercel](https://vercel.com) (Hosting), [Sentry](https://sentry.io) (Monitoring), Snyk (Security)

---

## Getting Started

### Prerequisites
- **Node.js**: v20.x or higher
- **pnpm**: v8.x or higher
- **Convex Account**: [Sign up here](https://convex.dev)
- **Clerk Account**: [Sign up here](https://clerk.com)
- **Browserless.io API Key**: [Get API key](https://browserless.io)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ghost-writer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```bash
   # Convex
   CONVEX_DEPLOYMENT=<your-convex-deployment>
   NEXT_PUBLIC_CONVEX_URL=<your-convex-url>

   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-key>
   CLERK_SECRET_KEY=<your-clerk-secret>

   # Browserless.io
   BROWSERLESS_API_KEY=<your-browserless-key>

   # Sentry (optional)
   SENTRY_DSN=<your-sentry-dsn>

   # Admin Setup
   LEAD_ADMIN_EMAIL=<admin-email>
   ```

4. **Initialize Convex**
   ```bash
   pnpm convex dev
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

### Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js and Convex in parallel |
| `pnpm dev:next` | Start Next.js only |
| `pnpm dev:convex` | Start Convex only |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

---

## Project Structure

```
ghost-writer/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (authenticated)/          # Protected routes
│   │   │   ├── admin/                # Admin-only pages
│   │   │   │   ├── letters/          # Letter CRUD
│   │   │   │   └── users/            # User management
│   │   │   ├── clients/              # Client management
│   │   │   └── dashboard/            # Team & Admin dashboards
│   │   ├── onboarding/               # Post-signup social verification
│   │   ├── waiting-room/             # Pending user holding page
│   │   └── layout.tsx                # Root layout with providers
│   ├── components/                   # Reusable UI components
│   │   ├── AppShell/                 # Navigation shell
│   │   ├── TiptapEditor/             # Rich text editor
│   │   └── ...
│   ├── lib/                          # Utilities and helpers
│   └── theme/                        # Mantine theme configuration
├── convex/                           # Convex backend
│   ├── schema.ts                     # Database schema
│   ├── users.ts                      # User queries/mutations
│   ├── clients.ts                    # Client queries/mutations
│   ├── letters.ts                    # Letter queries/mutations
│   ├── pdf.ts                        # PDF generation action
│   └── lib/auth.ts                   # RBAC helpers
├── public/                           # Static assets
└── [docs]/                           # Project documentation
```

### Route Organization
- **Public Routes**: `/`, `/sign-up`, `/onboarding`, `/waiting-room`
- **Team Routes**: `/dashboard`, `/clients/*`
- **Admin Routes**: `/admin/letters/*`, `/admin/users/*`

---

## Development Status

Ghost-Writer is currently in active development following a phased rollout strategy:

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 0: Bootstrap** | ✅ Complete | First admin auto-promotion, dev seeding, empty states |
| **Phase 1: Secure Foundation** | ✅ Complete | Auth, RBAC, letter library, Tiptap editor, color scheme toggle |
| **Phase 2: Operational Core** | ⏳ In Progress | Team dashboard, client management, PDF pipeline, 91-day purge |
| **Phase 3: Strategic Intelligence** | 📅 Planned | CRA filtering, outcome tracking, advanced analytics, visual form builder |

See [DEVELOPMENT_PHASING.md](Architect/DEVELOPMENT_PHASING.md) for detailed milestones.

---

## Security & Compliance

- **Role-based access control** with manual approval workflow
- **Last 4 SSN digits only** (formatted as `XXX-XX-1234`)
- **Data lifecycle tracking** (days active monitoring)
- **Ephemeral PDF generation** (zero disk persistence)
- **Audit logging** for compliance verification
- **Planned**: 91-day auto-purge with cascading deletion *(currently deferred)*

See [PROJECT_FOUNDATION.md](PROJECT_FOUNDATION.md) for complete security architecture.

---

## License

This is a private, internal tool developed for credit repair automation. All rights reserved.

---

## Contact

For questions or access requests, contact the project administrator via the approved social verification channels.

---

*Last Updated: January 2025 (v3.0 - Convex Stack)*

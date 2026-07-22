# AGENTS.md — Biso Express CRM

## Stack

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 · Shadcn UI (base-nova style) · Firebase Auth + Firestore · React Hook Form · Zod · TanStack Table · Framer Motion · Lucide React

## Project root

`biso-crm/` — all commands run from here.

## Commands

```bash
npm run dev      # Dev server (Turbopack, port 3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture (Feature First)

```
src/
  app/             → route pages (no business logic)
  actions/         → Server Actions (call services, never Firestore directly)
  components/
    ui/            → Shadcn components
    common/        → reusable: PageHeader, StatCard, DataTable, EmptyState, SearchBar, etc.
    layout/        → AppShell, AppSidebar, AppHeader
  features/        → business modules (clients/, dashboard/, auth/, settings/)
  repositories/    → Firestore CRUD only (no business rules)
  services/        → business logic, validation, rules (use repositories)
  schemas/         → Zod schemas
  hooks/           → useAuth (from providers/), usePagination, useDebounce
  firebase/        → config, auth, firestore exports
  types/           → Client, User, Settings, Pagination types
  constants/       → ROUTES, ROLES, SOURCES, CUSTOMER_TYPES
  utils/           → format-date, format-phone, download-csv
  providers/       → AuthProvider (Firebase onAuthStateChanged)
```

**Data flow is unidirectional:** UI → Server Action → Service → Repository → Firestore
Reverse direction for reads.

## Conventions

- **No `any`** — use `unknown` or explicit types
- **Server Components by default** — `"use client"` only when needed (forms, dialogs, animations, hooks)
- **All forms use React Hook Form + Zod** — no manual validation
- **All Firestore access through repositories** — components never call Firestore directly
- **Suppression logique uniquement** (`isArchived = true`) — never delete documents
- **Phone is unique** per client — enforce in services
- **camelCase** for everything — variables, functions, interfaces, collections, fields
- **PascalCase** for components
- **UPPER_SNAKE_CASE** for constants
- **No CSS/SASS** — Tailwind only
- **Shadcn first** — never create custom components when Shadcn has an equivalent

## Theme

- **Primary:** Orange (oklch 0.705 0.213 47.604) — buttons, CTAs, active states
- **Secondary:** Blue (for charts, badges, secondary links)
- **Font:** Geist (sans-serif)
- **Light mode only** for MVP
- **Border radius:** `rounded-lg` inputs/buttons, `rounded-xl` cards/dialogs
- **Shadows:** `shadow-sm` or `shadow-md` only

## Colors (docs/08)

| Role        | Token           |
|-------------|-----------------|
| Primary     | orange-500      |
| Secondary   | blue-500        |
| Neutral     | slate-50→900    |
| Success     | green-600       |
| Warning     | amber-500       |
| Danger      | red-600         |

## Firebase

- Doc IDs: Auto-generated for clients, Auth UID for users
- 3 collections: `users`, `clients`, `settings`
- `settings/general` — single document for app config
- Notes embedded in client documents (no subcollection)
- All dates use Firebase `Timestamp` (not `Date()` or `string`)

## RBAC (docs/07)

| Action           | Admin | Employee |
|------------------|:-----:|:--------:|
| CRUD clients     |   ✅  |    ✅    |
| Archive/restore  |   ✅  |    ❌    |
| Import/Export    |   ✅  |    ❌    |
| Settings         |   ✅  |    ❌    |
| User management  |   ✅  |    ❌    |
| Notes            |   ✅  |    ✅    |

Permissions must be checked in UI, Server Actions, AND Firestore rules.

## Source of truth

All docs in `docs/` at repo root. Read before implementing:
- `docs/01-PRD.md`
- `docs/05-Firestore-Schema.md`
- `docs/06-Business-Rules.md`
- `docs/08-UI-Guidelines.md`
- `docs/09-Coding-Standards.md`
- `docs/10-Architecture.md`
- `docs/12-AGENTS.md` (AI agent instructions)

⚠️ This is NOT a delivery/tracking/ERP app — CRM only (clients database).

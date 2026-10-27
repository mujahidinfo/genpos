# GenPOS — Sales Point of Sale

Next.js 16 (App Router) · React 19 · TypeScript 6 · Prisma 6 (PostgreSQL) · tRPC v11 · Tailwind CSS v4 · shadcn/ui · pnpm

## Monorepo Layout

pnpm workspaces. Run all commands from the repo root.

```
apps/
  web/        # @genpos/web    — Next.js frontend — PAUSED: still on the pre-tenancy schema, to be moved onto the API
  api/        # @genpos/api    — NestJS 12 multi-tenant REST API + JWT/Google auth (localhost:4000, see apps/api/README.md)
  mobile/     # @genpos/mobile — Expo SDK 58 POS app (barcode scanning, sign-up/onboarding), see apps/mobile/README.md
packages/
  db/         # @genpos/db     — Prisma schema, migrations, seed, re-exported client
```

- Import Prisma types/client from `@genpos/db`, never `@prisma/client` directly in apps.
- Env files: `apps/web/.env`, `apps/api/.env` (runtime) and `packages/db/.env` (Prisma CLI). See each `.env.example`.
- `@genpos/db` is plain JS (`export * from "@prisma/client"`) so it needs no build step for Next or Nest.

## Commands

```bash
pnpm dev          # api (localhost:4000)
pnpm dev:web      # web only (paused — does not build on the tenant schema)
pnpm dev:api      # api only (Swagger at localhost:4000/api/docs)
pnpm dev:mobile   # Expo / Metro (needs the api running)
pnpm build        # build the api
pnpm lint         # lint api + mobile

pnpm db:migrate   # prisma migrate dev
pnpm db:deploy    # prisma migrate deploy (apply committed migrations)
pnpm db:generate  # prisma generate (after schema changes)
pnpm db:push      # prisma db push (no migration file)
pnpm db:seed      # run packages/db/prisma/seed.ts
pnpm db:studio    # open Prisma Studio
```

## API (`apps/api`)

NestJS 12, **native ESM** — relative imports need the `.js` suffix. Full endpoint list in `apps/api/README.md`.

- REST under `/api/v1`; every route needs `Authorization: Bearer <accessToken>` unless decorated `@Public()`
- **Multi-tenant**: `TenantGuard` resolves the branch from the `X-Shop-Id` header; inject it with `@Tenant() tenant: TenantContext` and scope every query by `tenant.businessId` (shared data) or `tenant.shopId` (branch data). Routes not tied to a branch use `@NoTenant()`
- Roles via `@Roles(...MANAGERS)` / `@Roles(...CATALOG_EDITORS)` / `@Roles('OWNER')` — membership roles `OWNER · MANAGER · CASHIER · INVENTORY_MANAGER`
- Validation: zod schemas wrapped with `createZodDto` from `nestjs-zod`; use `isoDate` (not `z.coerce.date()`) for dates so Swagger generation works
- Auth: short-lived JWT access token + rotating opaque refresh token stored SHA-256-hashed in `Session`
- Module layout: `src/modules/<feature>/<feature>.{dto,service,controller,module}.ts`
- Stock lives in `Inventory` (per branch × variant); every product has ≥1 variant (`isDefault` for simple products). Use `prisma.inventory.fields.lowStock` for low-stock comparisons

## Mobile (`apps/mobile`)

Expo SDK 58 / React Native 0.88. Read `apps/mobile/AGENTS.md` first — Expo APIs change every SDK, verify against versioned docs.

- Add native deps with `npx expo install <pkg>` (run inside apps/mobile), never plain `pnpm add`
- `src/app` is routes only; signed-in area is `(app)/` with NativeTabs and one Stack per tab; auth gate via `Stack.Protected` in `src/app/_layout.tsx`
- API calls go through `api()` in `src/lib/api-client.ts` (token refresh + `X-Shop-Id`); query hooks and mutations live in `src/api/queries.ts`
- Session (`src/lib/session.tsx`) holds user, businesses and the active branch; `useActiveShop()` gives the branch + role. Cart: `src/lib/cart.tsx`
- Routes: `sign-in`/`sign-up`/`onboarding` at the root; signed-in app in `(app)/` = `(tabs)/` (Sell first) + POS modals (`add-item`, `new-product`, `checkout`, `branches`)
- Response types are hand-written in `src/api/types.ts` (dates are ISO strings) — keep in sync with apps/api
- Money: `useFormatCurrency()` from `src/lib/format.ts` (same locale rule as the web app)
- Checks: `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor`

## Web App Structure (`apps/web`) — paused

The web app still targets the pre-tenancy schema (last working on branch `chore/monorepo-structure`). Next step: move it onto the REST API.

```
src/
  app/
    (auth)/login/             # public login page
    (dashboard)/              # protected layout — requires session
      dashboard/              # overview + KPIs
      analytics/              # charts & reports
      inventory/              # product & stock management
      orders/                 # order list & detail
      sales/                  # POS / new-sale flow
      customers/              # customer management
      finance/                # finance overview
        expenses/             # expense tracking + category manager
        employees/            # employee & salary management
        budget/               # budget planning
        reports/              # financial report generation
      settings/               # shop settings, users
    api/trpc/[trpc]/          # tRPC HTTP handler
  components/
    ui/                       # shadcn/ui primitives
    layout/                   # Sidebar, Header, LayoutProvider, MainWrapper
    <feature>/                # e.g. analytics/, orders/, inventory/, finance/
      *-view.tsx              # RSC — fetches data via server-side tRPC caller
      *-view-client.tsx       # Client component — receives data as props
  lib/
    auth.ts                   # getSession, requireAuth, canAccess
    prisma.ts                 # PrismaClient singleton (imports from @genpos/db)
    currency-context.tsx      # useFormatCurrency hook + CurrencyProvider
    trpc/
      server.ts               # router, publicProcedure, protectedProcedure, adminProcedure
      client.tsx              # tRPC React client + QueryClientProvider
  server/routers/
    _app.ts                   # root AppRouter
    auth.ts / products.ts / orders.ts / customers.ts
    analytics.ts / shop.ts / users.ts / categories.ts
    finance.ts                # expenses, employees, budget, reports sub-routers
```

Prisma: `packages/db/prisma/schema.prisma` (source of truth), `migrations/`, `seed.ts`.

## Auth

Custom cookie-based sessions — **no NextAuth**.

- Cookie: `session_token` (httpOnly)
- `getSession()` — reads cookie, validates against `Session` table, returns `AuthUser | null`
- `requireAuth(roles?)` — server-side guard; redirects to `/login` if unauthenticated
- Roles: `ADMIN` · `CASHIER` · `INVENTORY_MANAGER`
- tRPC procedures: `publicProcedure`, `protectedProcedure`, `adminProcedure`

## Database Schema (key models)

| Model | Notes |
|-------|-------|
| `Business` | SaaS account; currency + language shared by its branches |
| `Shop` | A branch/outlet of a business (taxRate, allowNegativeStock) |
| `Membership` | User ↔ Business with role; optional `shopId` pins staff to one branch |
| `User` | Email, optional passwordHash, optional googleId, isActive |
| `Session` | Token-based, has `expiresAt` |
| `Category` | Product categories |
| `Product` | price, costPrice, SKU, barcode, categoryId |
| `ProductVariant` | Every product has ≥1; `isDefault` hidden variant for simple products |
| `Inventory` | Stock per branch × variant (quantity, lowStock) |
| `StockMovement` | IN / OUT / ADJUSTMENT / RETURN |
| `Customer` | Optional; linked to orders |
| `Order` | orderNumber, subtotal, discount, tax, total, paymentMethod, status |
| `OrderItem` | Snapshot of name/price at time of sale |
| `Refund` | Linked to Order |
| `ExpenseCategory` | Finance — expense categories with color |
| `Expense` | Finance — shop expenses linked to category + optional employee |
| `Employee` | Finance — staff with salary (MONTHLY/HOURLY/WEEKLY/ANNUALLY) |
| `Budget` | Finance — spending limits by period and optional category |

Enums: `MemberRole`, `OrderStatus`, `OrderType`, `PaymentMethod`, `StockMovementType`, `SalaryType`, `ExpenseStatus`, `BudgetPeriod`

## Key Conventions

- **RSC + Client split**: server component (`*-view.tsx`) fetches data, passes to a `"use client"` child (`*-view-client.tsx`) as props. The client wrapper uses `dynamic(..., { ssr: false })`.
- **tRPC**: called server-side in RSC via `createCaller`; called client-side via `@trpc/react-query` hooks
- **Forms**: react-hook-form + zod v4 (`z.flattenError` used in tRPC error formatter)
- **UI**: shadcn/ui with slate base color, CSS variables, Tailwind v4, `@/components` alias
- **IDs**: `cuid()` for all primary keys
- **Timestamps**: `createdAt` / `updatedAt` on all models via Prisma defaults
- **Currency**: always use `useFormatCurrency()` from `@/lib/currency-context` in client components that display prices
- **Prisma include types**: use `Prisma.XxxGetPayload<{include: ...}>` for component prop types — tRPC does not always propagate include types through inference
- **Case-insensitive search**: use `mode: "insensitive" as const` in Prisma string filters

## Finance Module

All finance routes are ADMIN-only (`requireAuth(["ADMIN"])`).

Sub-routes under `/finance`:
- `/finance` — overview with income vs expense chart and KPI cards
- `/finance/expenses` — expense CRUD + category manager
- `/finance/employees` — employee salary tracking
- `/finance/budget` — budget planning with progress bars
- `/finance/reports` — income statement, expense report, salary report

The `finance.ts` router uses nested sub-routers:
```
finance.overview
finance.expenseCategories.{list, create, update, delete}
finance.expenses.{list, create, update, delete}
finance.employees.{list, create, update}
finance.budget.{list, create, update, delete}
finance.report
```

Shared sub-navigation: `src/components/finance/finance-nav.tsx` — include in every finance page.

## Environment Variables

```
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/genpos"
SESSION_SECRET="<min 32 chars>"
NEXT_PUBLIC_APP_NAME="GenPOS"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Path Aliases

`@/` → `src/`  
`@/components` → `src/components`  
`@/lib/utils` → `src/lib/utils`

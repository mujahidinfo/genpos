# GenPOS — Sales Point of Sale

Next.js 16 (App Router) · React 19 · TypeScript 6 · Prisma 6 (PostgreSQL) · tRPC v11 · Tailwind CSS v4 · shadcn/ui · pnpm

## Commands

```bash
pnpm dev          # start dev server (localhost:3000)
pnpm build        # production build
pnpm lint         # ESLint

pnpm db:migrate   # prisma migrate dev
pnpm db:generate  # prisma generate (after schema changes)
pnpm db:push      # prisma db push (no migration file)
pnpm db:seed      # run prisma/seed.ts
pnpm db:studio    # open Prisma Studio
```

## Project Structure

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
    prisma.ts                 # PrismaClient singleton
    currency-context.tsx      # useFormatCurrency hook + CurrencyProvider
    trpc/
      server.ts               # router, publicProcedure, protectedProcedure, adminProcedure
      client.tsx              # tRPC React client + QueryClientProvider
  server/routers/
    _app.ts                   # root AppRouter
    auth.ts / products.ts / orders.ts / customers.ts
    analytics.ts / shop.ts / users.ts / categories.ts
    finance.ts                # expenses, employees, budget, reports sub-routers
prisma/
  schema.prisma               # source of truth for DB models
  seed.ts                     # seeding script
```

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
| `Shop` | Single shop config (name, currency, taxRate) |
| `User` | Email+passwordHash, role, isActive |
| `Session` | Token-based, has `expiresAt` |
| `Category` | Product categories |
| `Product` | price, costPrice, SKU, barcode, categoryId |
| `ProductVariant` | Inherits from Product; has stock + lowStock threshold |
| `StockMovement` | IN / OUT / ADJUSTMENT / RETURN |
| `Customer` | Optional; linked to orders |
| `Order` | orderNumber, subtotal, discount, tax, total, paymentMethod, status |
| `OrderItem` | Snapshot of name/price at time of sale |
| `Refund` | Linked to Order |
| `ExpenseCategory` | Finance — expense categories with color |
| `Expense` | Finance — shop expenses linked to category + optional employee |
| `Employee` | Finance — staff with salary (MONTHLY/HOURLY/WEEKLY/ANNUALLY) |
| `Budget` | Finance — spending limits by period and optional category |

Enums: `Role`, `OrderStatus`, `OrderType`, `PaymentMethod`, `StockMovementType`, `SalaryType`, `ExpenseStatus`, `BudgetPeriod`

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

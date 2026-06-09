# GenPOS — Sales Point of Sale

A full-featured point-of-sale and shop management system built with Next.js 16 (App Router), React 19, TypeScript, Prisma 6, tRPC v11, Tailwind CSS v4, and shadcn/ui.

## Features

- **Sales / POS** — Product search, cart with discounts & tax, multiple payment methods
- **Order Management** — Status tracking (Pending → Fulfilled → Refunded), search & filter, refunds
- **Inventory** — Products with variants, SKU/barcode, stock movements, low-stock alerts
- **Customers** — Customer profiles linked to order history
- **Analytics** — Revenue trend, top products, category breakdown (7 / 30 / 90 days)
- **Finance** — Expense tracking, employee salary management, budget planning, financial reports
- **User Roles** — Admin, Cashier, Inventory Manager with route guards
- **Shop Settings** — Name, currency, tax rate, user management

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (slate) |
| Language | TypeScript 6 |
| API | tRPC v11 + superjson |
| ORM | Prisma 6 (PostgreSQL) |
| Auth | Custom cookie-based sessions (no NextAuth) |
| Forms | react-hook-form + Zod v4 |
| Charts | Recharts |
| Package manager | pnpm |

## Quick Start

### Prerequisites

- Node.js 18+, pnpm, PostgreSQL

### Setup

```bash
pnpm install
cp .env.example .env        # fill in DATABASE_URL, SESSION_SECRET
pnpm db:push                # sync schema to database
pnpm db:seed                # seed admin user + sample data
pnpm dev                    # start on localhost:3000
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | admin123 |
| Cashier | cashier@demo.com | cashier123 |
| Inventory | inventory@demo.com | inventory123 |

## Commands

```bash
pnpm dev          # start dev server (localhost:3000)
pnpm build        # production build
pnpm lint         # ESLint

pnpm db:migrate   # prisma migrate dev (creates migration file)
pnpm db:generate  # prisma generate (after schema changes)
pnpm db:push      # prisma db push (sync schema, no migration file)
pnpm db:seed      # run prisma/seed.ts
pnpm db:studio    # open Prisma Studio
```

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/genpos"
SESSION_SECRET="<min 32 chars>"
NEXT_PUBLIC_APP_NAME="GenPOS"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
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
        expenses/             # expense tracking
        employees/            # employee & salary management
        budget/               # budget planning
        reports/              # financial report generation
      settings/               # shop settings, users
    api/trpc/[trpc]/          # tRPC HTTP handler
  components/
    ui/                       # shadcn/ui primitives
    layout/                   # Sidebar, Header, LayoutProvider, MainWrapper
    <feature>/                # feature components
      *-view.tsx              # RSC — data fetching layer
      *-view-client.tsx       # "use client" dynamic import wrapper
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
    finance.ts                # expenses, employees, budget, reports
prisma/
  schema.prisma               # source of truth for DB models
  seed.ts                     # seeding script
```

## Auth & Roles

Custom cookie-based sessions — no NextAuth.

| Role | Dashboard | Sales/POS | Orders | Inventory | Customers | Analytics | Finance | Settings |
|---|---|---|---|---|---|---|---|---|
| `ADMIN` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `CASHIER` | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| `INVENTORY_MANAGER` | ✓ | — | ✓ | ✓ | — | — | — | — |

## Database Schema

| Model | Notes |
|---|---|
| `Shop` | Single shop config (name, currency, taxRate) |
| `User` | Email + passwordHash, role, isActive |
| `Session` | Token-based, has `expiresAt` |
| `Category` | Product categories |
| `Product` | price, costPrice, SKU, barcode, categoryId |
| `ProductVariant` | Stock + lowStock threshold |
| `StockMovement` | IN / OUT / ADJUSTMENT / RETURN |
| `Customer` | Optional; linked to orders |
| `Order` | orderNumber, subtotal, discount, tax, total, paymentMethod, status |
| `OrderItem` | Snapshot of name/price at time of sale |
| `Refund` | Linked to Order |
| `ExpenseCategory` | Finance — categories with color coding |
| `Expense` | Finance — shop expenses linked to category + optional employee |
| `Employee` | Finance — staff with salary (monthly/hourly/weekly/annually) |
| `Budget` | Finance — spending limits by period and optional category |

## Finance Module

The Finance module (`/finance/*`, ADMIN only) covers:

- **Overview** — income vs expenses 6-month trend, expenses by category pie chart, recent activity
- **Expenses** — full CRUD with category manager, filters (date range, category, status, payment method)
- **Employees** — salary cards with monthly payroll estimate, activate/deactivate
- **Budget** — budget cards with live progress bars, over-budget color alerts
- **Reports** — income statement, expense report, salary report; date-range presets; printable

## License

MIT

# GenPOS — Modern Point of Sale

A full-featured, open-source POS system for small shops built with Next.js 14, tRPC, Prisma, and Shadcn UI.

## Features

- **Sales / POS** — Product grid, cart with discounts & tax, multiple payment methods
- **Order Management** — Status tracking (Pending → Fulfilled → Refunded), search & filter
- **Inventory Management** — Products, variants, stock levels, low-stock alerts, barcode support
- **Customer Database** — Store customer info, track purchase history
- **Analytics Dashboard** — Revenue charts, top products, category breakdown
- **User Roles** — Admin, Cashier, Inventory Manager with route guards
- **Shop Settings** — Name, currency, tax rate, user management
- **Dark Mode** — System-aware theme switching

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.7 (App Router) |
| UI | Shadcn UI + Tailwind CSS v4 |
| API | tRPC v11.17 (stable) |
| ORM | Prisma 7 |
| Database | PostgreSQL (or MySQL) |
| Auth | Cookie sessions + bcryptjs v3 |
| Charts | Recharts v3 |
| Validation | Zod v4 |
| React | React 19 |

## Quick Start

### 1. Install dependencies
```bash
npm install
# or
pnpm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database URL and session secret
```

### 3. Run database migrations
```bash
npm run db:push
```

### 4. Seed demo data
```bash
npm run db:seed
```

### 5. Start development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | admin123 |
| Cashier | cashier@demo.com | cashier123 |
| Inventory | inventory@demo.com | inventory123 |

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/         # Login page
│   └── (dashboard)/          # Protected dashboard pages
│       ├── dashboard/
│       ├── sales/            # POS interface
│       ├── orders/
│       ├── inventory/
│       ├── customers/
│       ├── analytics/
│       └── settings/
├── components/
│   ├── ui/                   # Shadcn UI components
│   ├── layout/               # Sidebar, Header
│   ├── dashboard/
│   ├── sales/
│   ├── orders/
│   ├── inventory/
│   ├── customers/
│   ├── analytics/
│   └── settings/
├── lib/
│   ├── auth.ts               # Session helpers
│   ├── prisma.ts             # Prisma singleton
│   ├── utils.ts              # Utilities
│   └── trpc/                 # tRPC client & server
└── server/
    └── routers/              # tRPC routers
        ├── _app.ts
        ├── auth.ts
        ├── products.ts
        ├── orders.ts
        ├── customers.ts
        ├── analytics.ts
        ├── categories.ts
        ├── shop.ts
        └── users.ts
prisma/
├── schema.prisma             # Database schema
└── seed.ts                   # Demo data seeder
```

## Database

The schema supports both PostgreSQL and MySQL. Change the `provider` in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"    // or "postgresql"
  url      = env("DATABASE_URL")
}
```

## License

MIT

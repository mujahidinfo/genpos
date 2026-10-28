# @genpos/api

Multi-tenant REST backend for GenPOS — NestJS 12 (native ESM) · Prisma via `@genpos/db` · zod v4 validation (`nestjs-zod`) · JWT auth · Google sign-in.

## Run

```bash
cp apps/api/.env.example apps/api/.env   # DATABASE_URL, JWT_SECRET, optional GOOGLE_CLIENT_IDS
pnpm db:deploy                           # apply migrations
pnpm dev:api                             # http://localhost:4000 (watch mode)
```

- Base URL: `http://localhost:4000/api/v1` · Swagger UI: `/api/docs` (not in production) · Health: `GET /api/v1/health`

## Tenancy

```
User ──Membership(role, optional shopId)──▶ Business ──▶ Shop (branch) …
```

- **Business** = the SaaS account. Catalog, customers, employees and expense categories are shared by all its branches.
- **Shop** = a branch/outlet. Stock (`Inventory`), stock movements, orders, expenses and budgets belong to one branch.
- Every tenant route resolves the active branch from the **`X-Shop-Id`** header (`TenantGuard`). A user with exactly one branch may omit it. Membership is checked on every request, so other businesses' data is unreachable.
- Roles: `OWNER` · `MANAGER` · `CASHIER` · `INVENTORY_MANAGER`. A membership with `shopId` is pinned to that branch.
- `allowNegativeStock` (per branch, default **on**): a sale is never blocked at the counter; stock goes negative and shows as low/out for a recount. Turn off to block oversells.

## Auth

| Endpoint | Body | Notes |
|---|---|---|
| `POST /auth/register` | `{ name, email, password }` | Password ≥ 8 chars. New users have no business → onboarding |
| `POST /auth/login` | `{ email, password }` | |
| `POST /auth/google` | `{ idToken }` | Verifies a Google ID token against `GOOGLE_CLIENT_IDS`; creates or links the account. 503 when not configured |
| `POST /auth/refresh` | `{ refreshToken }` | Rotates: old refresh token is invalidated |
| `POST /auth/logout` | `{ refreshToken }` | Public, works with an expired access token |
| `GET /auth/me` · `PATCH /auth/password` | | Google-only accounts can set a first password without `currentPassword` |

Access token: JWT (`JWT_ACCESS_TTL`, default 15m). Refresh token: opaque, stored SHA-256-hashed in `Session` (`REFRESH_TOKEN_TTL_DAYS`, default 30). Credential endpoints are rate-limited to 10/min per IP.

## Endpoints

| Resource | Routes | Roles |
|---|---|---|
| businesses | `GET /businesses` (my businesses + branches), `POST /businesses` (onboarding: business + first branch) | any signed-in user, no `X-Shop-Id` |
| shops | `GET /shops`, `POST /shops` (add branch) | add: OWNER |
| shop | `GET /shop` (active branch + business currency/language/role), `PUT /shop`, `PATCH /shop/language` | writes: OWNER, MANAGER |
| members | `GET /members`, `POST /members` (add staff, optional `shopId`), `PATCH /members/:id` | OWNER, MANAGER |
| categories | `GET/POST /categories`, `PATCH/DELETE /categories/:id` | writes: catalog editors |
| products | `GET /products?search&categoryId&lowStock&page&pageSize`, `GET /products/:id`, `GET /products/barcode/:code`, `POST /products`, `PATCH/DELETE /products/:id`, `POST /products/:id/stock` | writes: catalog editors |
| customers | `GET /customers?search`, `GET /customers/lookup?phone`, `GET/PATCH /customers/:id`, `POST /customers`, `POST /customers/find-or-create`, `DELETE /customers/:id` | delete: OWNER, MANAGER |
| orders | `GET /orders?…`, `GET /orders/:id`, `POST /orders`, `PATCH /orders/:id/status`, `POST /orders/:id/refunds` | refunds: OWNER, MANAGER |
| analytics | `GET /analytics/{overview,sales-chart,top-products,revenue-by-category}?days` | any |
| suppliers | `GET /suppliers` (with `totalPurchased`/`totalPaid`/`due`), `GET/PATCH /suppliers/:id`, `POST /suppliers`, `POST /suppliers/:id/payments` | catalog editors; payments: OWNER, MANAGER |
| purchases | `GET /purchases?supplierId`, `GET /purchases/:id`, `POST /purchases` (receive stock into the active branch) | catalog editors |
| finance | `GET /finance/overview`, `GET /finance/report`, CRUD under `/finance/{expense-categories,expenses,employees,budgets}` | OWNER, MANAGER |

Catalog editors = OWNER, MANAGER, INVENTORY_MANAGER.

**Products & stock.** Every product has ≥ 1 variant; a simple product gets one hidden `isDefault` variant, so stock always lives on variants. Responses flatten the active branch's inventory onto each variant as `stock` / `lowStock`. `POST /products` accepts `stock` for simple products. Barcodes are unique per business across products *and* variants (409 names the clashing product).

**POS scan.** `GET /products/barcode/:code` → the product plus `matchedVariantId` (the variant to sell). 404 = unknown barcode, so the client offers "add product". `POST /orders` lines may omit `variantId` for simple products; `amountTendered` records cash handed over.

**Suppliers & purchases.** Suppliers are business-wide. `POST /purchases` adds each line to the active branch's inventory, records an `IN` stock movement, updates the product cost price (`updateCostPrice`, default true) and, with `paidAmount`, records a supplier payment. Supplier `due` = purchases − payments.

Dates in query/body are ISO strings (`2026-10-27` or `2026-10-27T10:00:00Z`).

## Structure

```
src/
  main.ts                    # bootstrap: /api/v1 prefix, CORS, Swagger
  app.module.ts              # global pipe (zod), guards (throttle → JWT → tenant → roles), Prisma error filter
  config/env.ts              # zod-validated environment
  prisma/                    # PrismaService (extends client from @genpos/db)
  common/
    decorators.ts            # @Public, @NoTenant, @Roles, @CurrentUser, @Tenant, MANAGERS, CATALOG_EDITORS
    guards.ts                # JwtAuthGuard, TenantGuard, RolesGuard
  modules/<feature>/<feature>.{dto,service,controller,module}.ts
```

Every service takes the `TenantContext` and scopes queries by `businessId` (shared data) or `shopId` (branch data). Use `where: { id, businessId }` / `{ id, shopId }` for id-based updates and deletes.

# @genpos/api

Standalone REST backend for GenPOS — NestJS 12 (native ESM) · Prisma via `@genpos/db` · zod v4 validation (`nestjs-zod`) · JWT auth.

## Run

```bash
cp apps/api/.env.example apps/api/.env   # set DATABASE_URL + JWT_SECRET
pnpm dev:api                             # http://localhost:4000 (watch mode)
pnpm build:api && pnpm --filter @genpos/api start:prod
```

- Base URL: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api/docs` (disabled when `NODE_ENV=production`)
- Health: `GET /api/v1/health` → `{ status, db }`

## Auth

All routes require `Authorization: Bearer <accessToken>` unless marked `@Public()`.

| Endpoint | Body | Notes |
|---|---|---|
| `POST /auth/login` | `{ email, password }` | Returns `accessToken`, `refreshToken`, expiry times, `user` |
| `POST /auth/refresh` | `{ refreshToken }` | **Rotates**: old refresh token is invalidated, new pair returned |
| `POST /auth/logout` | `{ refreshToken }` | Public, so it works with an expired access token |
| `GET /auth/me` | — | Current user |
| `PATCH /auth/password` | `{ currentPassword, newPassword }` | |

- Access token: JWT signed with `JWT_SECRET`, lifetime `JWT_ACCESS_TTL` (default `15m`).
- Refresh token: opaque random string, stored **only as a SHA-256 hash** in the `Session` table, lifetime `REFRESH_TOKEN_TTL_DAYS` (default 30).
- The user is re-loaded on every request, so deactivating a user or changing their role takes effect immediately.
- Roles are enforced with `@Roles('ADMIN')` on controllers/handlers (global `RolesGuard`).

## Endpoints

| Resource | Routes | Roles |
|---|---|---|
| shop | `GET /shop`, `PUT /shop`, `PATCH /shop/language` | writes: ADMIN |
| users | `GET/POST /users`, `PATCH /users/:id` | ADMIN |
| categories | `GET/POST /categories`, `PATCH/DELETE /categories/:id` | writes: ADMIN |
| products | `GET /products?search&categoryId&lowStock&page&pageSize`, `GET /products/:id`, `GET /products/barcode/:barcode`, `POST /products`, `PATCH/DELETE /products/:id`, `POST /products/:id/stock` | create/update/delete: ADMIN |
| customers | `GET /customers?search`, `GET /customers/lookup?phone`, `GET/PATCH/DELETE /customers/:id`, `POST /customers`, `POST /customers/find-or-create` | delete: ADMIN |
| orders | `GET /orders?status&search&from&to&page&pageSize`, `GET /orders/:id`, `POST /orders`, `PATCH /orders/:id/status`, `POST /orders/:id/refunds` | any |
| analytics | `GET /analytics/{overview,sales-chart,top-products,revenue-by-category}?days` | any |
| finance | `GET /finance/overview?days`, `GET /finance/report?type&from&to&categoryId`, CRUD under `/finance/{expense-categories,expenses,employees,budgets}` | ADMIN |

Dates in query/body are ISO strings (`2026-10-27` or `2026-10-27T10:00:00Z`).

## Structure

```
src/
  main.ts                    # bootstrap: /api/v1 prefix, CORS, Swagger
  app.module.ts              # global pipe (zod), guards (JWT → roles), Prisma error filter
  config/env.ts              # zod-validated environment
  prisma/                    # PrismaService (extends client from @genpos/db)
  common/                    # decorators (@Public, @Roles, @CurrentUser), guards, filter, utils
  modules/<feature>/
    <feature>.dto.ts         # zod schemas → DTO classes via createZodDto
    <feature>.service.ts     # business logic (ported from apps/web tRPC routers)
    <feature>.controller.ts
    <feature>.module.ts
```

Conventions: ESM imports use the `.js` suffix; Prisma errors P2025/P2002/P2003 map to 404/409/400 automatically.

# @genpos/mobile

GenPOS mobile app — Expo SDK 58 · React Native 0.88 · Expo Router (NativeTabs) · TanStack Query. Talks to `apps/api` over REST with JWT auth.

## Run

```bash
pnpm dev:api        # start the API first (localhost:4000)
pnpm dev:mobile     # Metro; press a / i, or scan the QR code with Expo Go
```

In development the app reaches the API on **the machine running Metro** (`hostUri`), so a phone on the same Wi-Fi or an emulator works with no config. For anything else set:

```bash
# apps/mobile/.env.local
EXPO_PUBLIC_API_URL="https://api.example.com/api/v1"
```

Demo login: `admin@demo.com` / `admin123` (after `pnpm db:seed`).

## Screens

| Tab | Route | Shows |
|---|---|---|
| Home | `/` | Revenue hero for Today / 7 / 30 days, stat tiles, 7-day revenue columns, top sellers |
| Products | `/products`, `/products/[id]` | Searchable, paginated catalogue with low-stock flags; variants, stock, recent movements |
| Orders | `/orders`, `/orders/[id]` | Search + status filter; line items, totals, payment, refunds |
| Account | `/account` | User, shop settings, sign out |

## Auth

- `src/lib/session.tsx` — session context; routes are gated with `Stack.Protected` in `src/app/_layout.tsx`.
- `src/lib/api-client.ts` — access token kept in memory; on a 401 it refreshes once and retries. Refreshes are **single-flight** because the API rotates refresh tokens (two parallel refreshes would invalidate each other).
- The refresh token and cached user live in `expo-secure-store` (localStorage on web). On cold start the session is restored via `/auth/refresh`; if the device is offline the cached user is kept.

## Structure

```
src/
  app/                 # routes only (Expo Router)
    _layout.tsx        # providers + auth guard
    sign-in.tsx
    (app)/             # signed-in area: NativeTabs, one Stack per tab
  api/                 # response types + React Query hooks
  components/          # shared UI (themed text/view, card, list row, badge, charts…)
  constants/           # theme tokens, navigation options
  hooks/
  lib/                 # api client, session, config, formatting, storage
```

Checks: `npx tsc --noEmit` · `npx expo lint` · `npx expo-doctor`.

Notes:
- Android tab icons use Material Symbols (`md`), which are rasterised white and need `iconColor` to show up.
- Prefer a plain `Pressable` + `router.push` over `<Link asChild>` when the child uses a function `style` — the slot drops it on native.

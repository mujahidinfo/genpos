# @genpos/mobile

GenPOS mobile app — Expo SDK 58 · React Native 0.88 · Expo Router (NativeTabs) · TanStack Query · expo-camera barcode scanning. Talks to `apps/api` over REST with JWT auth.

## Run

```bash
pnpm dev:api        # start the API first (localhost:4000)
pnpm dev:mobile     # Metro; press a / i, or scan the QR code with Expo Go
```

In development the app reaches the API on **the machine running Metro** (`hostUri`), so a phone on the same Wi-Fi or an emulator works with no config. See `.env.example` for `EXPO_PUBLIC_API_URL` and Google sign-in IDs.

## User journey

1. **Sign up** (name, email, password) or **Continue with Google** → 2. **Set up your shop** (name, optional phone, currency; one screen) → 3. lands on **Sell**.

| Tab | Shows |
|---|---|
| **Sell** (`/`) | Live barcode scanner + cart. Scan a known item → added with haptic. Scan an unknown barcode → quick-add sheet prefilled with the code (catalog editors), saved straight into the cart. Search for items without barcodes. Charge → checkout |
| Today | Revenue for today / 7 / 30 days, stat tiles, 7-day chart, top sellers (active branch) |
| Products | Catalog with branch stock; **Add** opens quick-add with **Save & scan next** for importing a shelf |
| Orders | Search + status filter, order detail |
| More | Business / branch / role, switch or add branches; **Manage**: Receive stock, Suppliers (balances, payments), Staff (roles, branch, access); sign out |

Modals above the tabs (`src/app/(app)/`): `add-item` (search & tap-to-add), `new-product` (quick-add), `checkout` (payment, cash received + change, discount, customer, receipt share), `branches`, `receive-stock` (scan/search delivered items, qty + cost, paid / part / later), `member-form`, `supplier-form`, `supplier-payment`.

## How it works

- `src/lib/session.tsx` — tokens, user, businesses (`GET /businesses`) and the **active branch**. Status `loading → signedOut | needsShop | ready` drives `Stack.Protected` in `src/app/_layout.tsx`. Switching branch clears the query cache.
- `src/lib/api-client.ts` — sends `Authorization` + `X-Shop-Id`; single-flight refresh because refresh tokens rotate.
- `src/lib/cart.tsx` — cart state shared by scanner, search, quick-add and checkout; lines keyed by variant.
- `src/components/barcode-scanner.tsx` — camera permission flow, retail barcode types, ignores the same code for 1.5 s so one item isn't counted several times.
- `src/lib/google-sign-in.ts` — Google button shows only with client IDs **and** a development build (the native module isn't in Expo Go). `app.config.ts` adds the native plugin only when `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` is set.
- `src/lib/roles.ts` — mirrors the API's role groups to hide actions a role can't perform.

Checks: `npx tsc --noEmit` · `npx expo lint` · `npx expo-doctor`.

Notes:
- Android tab icons use Material Symbols (`md`), rasterised white — they need `iconColor`.
- Prefer `Pressable` + `router.push` over `<Link asChild>` when the child has a function `style`.
- Auth screens are direct children of the root stack (not a group) so the auth guard always has a route to land on.

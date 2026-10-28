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
| **Sell** (`/`) | Top bar: shop name (tap to switch branch when you have several) and your profile picture. Search pill + **Scan / Browse** toggle (remembered per device). Browse: category chips and a photo grid — tap adds, −/+ on the card. Scan: camera with bracket framing; an unknown barcode opens quick-add. White floating cart bar → `cart` sheet or Charge. Adding products happens on the Products tab |
| Today | Greeting, a revenue card with a Today / 7 days / 30 days switch, icon stat tiles (Low-stock → Reorder), 7-day chart, top sellers (active branch) |
| Products | Search + category chips, photo cards with a coloured stock line, a “running low → Reorder” banner; the floating **+** opens the photo-first `new-product` form |
| Orders | Newest first. Search + status chips; cards show payment method, customer or first item, total and status. Counter sales are always Completed |
| More | Icon tiles for the rest of the business, shown per role — **Stock**: Receive stock, Reorder, Suppliers · **Money**: Expenses, Bills · **Team & shops**: Staff & salaries, Branches |

**Money out** (More → Expenses): one screen for everything the business pays — manual expenses, salaries, supplier payments and repeating bills — with a period switch, money in vs out, a "to pay soon" strip with one-tap Pay, spending by category and the full ledger grouped by day. **Bills** (`more/bills`, `recurring-form`) are repeating costs like rent that come due weekly or monthly; **Staff & salaries** show who is paid this month (salary + pay day are set on the staff form, or via `employee-form` for people without an app login). Paying a bill or salary opens `pay-bill`, which records the expense. **Suppliers** list what you owe first; **Receive stock** is a guided flow (who delivered → scan/search → quantities and costs → payment → confirm) ending in a summary.

**Profile & settings** (profile picture, top right of every tab → `/profile`): your photo (tap it to take, choose or remove one), name, email and role; shop name, phone, address, email (tap to edit); language (English / বাংলা), currency, tax on/off + name + rate, sell-below-zero-stock; change password; sign out. Owners and managers can change settings — other roles see them read-only. Note: the app's own text is English for now; the language setting is saved on the shop and drives number formatting and the web dashboard.

Modals above the tabs (`src/app/(app)/`): `add-item` (search & tap-to-add), `new-product` (quick-add), `checkout` (payment, cash received + change, discount, customer, receipt share), `branches`, `profile`, `shop-form`, `currency`, `change-password`, `receive-stock` (scan/search delivered items, qty + cost, paid / part / later), `member-form`, `supplier-form`, `supplier-payment`, `expense-form` (amount-first, suggested categories created on first use, optional repeat), `pay-bill`, `recurring-form`, `employee-form`, `cart` (review the sale). `new-product` is photo-first: take/choose a photo (compressed on device, uploaded via `POST /uploads/product-image` to UploadThing), name, price, stock; cost, barcode and category under “More details”. `receive-stock?reorder=1` opens pre-filled with low-stock items and their usual supplier (from Products, the Low-stock tile on Today, or a supplier).

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

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: the owner-operator of a small retail shop in Bangladesh — grocery,
pharmacy, clothing, electronics — with roughly 1–5 staff. Today they run the shop
on a paper khata (ledger), a calculator, and memory. They are phone-first and
Bangla-first; a desktop computer may not exist at the counter at all.

Secondary users inside the same shop, served by role-based accounts:

- **Cashier** — rings up sales at the counter, needs speed and nothing else.
- **Inventory manager** — adds products, adjusts stock, watches low-stock levels.
- **Admin (usually the owner)** — sees everything, including finance.

The buying decision and the daily usage sit in the same person, so the landing
page and the product are read by the same eyes.

## Product Purpose

Replace the khata, the calculator, and the guesswork with one system that records
a sale once and updates everything downstream from it — stock, customer history,
daily revenue, and the books.

Success is a shop owner who can answer "what did I actually earn today, and what
is running out?" without doing arithmetic.

## Positioning

All-in-one and free to start: point of sale, inventory, customers, and finance in
a single system rather than a POS that later charges for reporting or requires
separate bookkeeping. Confirmed by the user: the "free to start" and "no credit
card required" claims are true and may be stated on the landing page.

Local fit is a real part of the product rather than a translation layer: Bangla
default UI, Bangladeshi Taka, mobile-money as a first-class payment method, and
an installable PWA that runs on an ordinary Android phone.

## Operating Context

- Used standing at a shop counter, often on a phone or a small tablet, one-handed,
  sometimes with a customer waiting.
- Prices are negotiated. The sale price of a line item is not always the shelf
  price, so the till must allow a per-line price override at the moment of sale.
- Payment arrives as cash, card, mobile money (bKash/Nagad-style), or bank
  transfer.
- The shop may have one device or several; staff share the counter.
- Installable to the home screen; expects to behave like an app, not a website.

## Capabilities and Constraints

Confirmed, shipped functionality:

- **Sales / POS** — product search, cart, per-line editable sale price with a
  below-cost warning, discounts (percentage or fixed), tax, invoice preview
  before charging, optional customer attached by phone number.
- **Inventory** — products, variants, categories, stock movements
  (IN/OUT/ADJUSTMENT/RETURN), low-stock thresholds, image upload.
- **Orders** — order list and detail, status, refunds. A POS sale is booked
  FULFILLED at the moment it is rung up.
- **Customers** — profile and purchase history, matched by phone number.
- **Analytics** — revenue, best sellers, trends.
- **Finance (admin only)** — expenses and expense categories, employees and
  salaries, budgets, and generated reports (income statement, expense, salary).
- **Settings** — shop details, currency, language, team accounts.

Constraints:

- Three roles: `ADMIN`, `CASHIER`, `INVENTORY_MANAGER`. Finance is admin-only.
- Four payment methods: cash, card, mobile money, bank transfer.
- Two languages: Bangla (default) and English. Every user-facing string is a
  translation key; no hard-coded prose in components.
- Default currency BDT, but the shop can change it in settings.
- Custom cookie-based sessions, not NextAuth.
- Installable PWA; the service worker deliberately does **not** cache
  authenticated pages or API responses, so the product does not claim offline
  selling.

Undecided / not established:

- Pricing beyond "free to start" — no tiers, limits, or paid plan exist yet.
- Hosting, deployment target, and any uptime or support commitment.

## Brand Commitments

- Name: **GenPOS**. Bangla rendering: জেনপস.
- Bangla is the default language, including on the landing page. English is a
  switch, not the primary.
- Bangla type is set in Tiro Bangla, which ships a single 400 weight.
- Existing accent is indigo; not stated as binding.

## Evidence on Hand

- **Real product screenshots may be used** — the application runs and its actual
  POS, inventory, and dashboard screens are legitimate assets for the landing page.
- **Nothing else exists.** The product is pre-launch: no users, no testimonials,
  no named shops, no customer logos, no usage metrics, no press, no case studies,
  no public demo login. None of these may be invented or implied.
- Factual claims that are safe to state, because they are true of the codebase:
  four payment methods, three team roles, Bangla and English, runs on phone,
  tablet and desktop, installable to the home screen.

## Product Principles

1. **One entry, everything updates.** The value is the connection between selling,
   stock, and the books — never a bundle of separate tools.
2. **The counter sets the pace.** Anything on the sales path is optimised for a
   person standing up, on a phone, with a customer waiting.
3. **Bangla is the product, not a translation.** Default language, local currency,
   local payment habits, local price negotiation.
4. **Honest numbers.** Money is shown exactly and never rounded or compacted where
   it is the amount someone pays; the system never implies certainty it lacks.
5. **Claim only what exists.** Pre-launch means no borrowed credibility — no
   invented customers, metrics, or proof of any kind.

## Accessibility & Inclusion

- Touch-first: controls sized for a thumb at a counter.
- Form fields must not trigger iOS focus zoom, and pinch-zoom must remain enabled
  (no `user-scalable=no`) — low-vision users at a counter depend on it.
- Bangla and English must both be fully legible; the type system cannot assume
  Latin-only metrics.

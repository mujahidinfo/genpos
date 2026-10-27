---
version: 1
slug: "src-components-landing-landing-page-tsx"
primary_target: "src/components/landing/landing-page.tsx"
related_targets: ["src/components/landing/rate-sheet-hero.tsx","src/components/landing/ledger-demo.tsx","src/components/landing/press-proof.tsx"]
---

# Landing page (`/`)

## Scope and mode

The public marketing surface at `/`. Visitor mode: **Persuade**. Everything behind
`/login` is Operate and does not inherit this world — the rate-sheet grammar stops
at the sign-in door.

## Audience and job

A Bangladeshi small-shop owner-operator, arriving on a phone, currently running the
shop on a paper khata and a calculator. Their job on this page is to decide whether
this replaces the pile of paper, and to start without paying.

## Action

One primary action, repeated twice (hero and close): **start free** → `/login`.
A secondary sign-in link for returning owners. No pricing table, no demo booking,
no newsletter — none exist.

## Proof and content

- Real, screened screenshots of the running product are the only external proof
  permitted. Currently one: the POS cart at `/public/landing/pos-cart-halftone.png`,
  showing a negotiated price (৳12 against a ৳14.99 list) and a live Taka total.
- All table and ledger rows are **synthetic demonstration data**, stamped
  "নমুনা তথ্য" on the page. They must stay labelled.
- Claims permitted: free to start, no card required, four payment methods, three
  roles, Bangla and English, runs on phone/tablet/desktop. All verifiable in code.
- Forbidden until real: customer counts, testimonials, named shops, logos, uptime,
  pricing tiers, a public demo login.

## Chosen direction

**Panjika rate table** (seed key `b940c090`) — the Bengali almanac and the daily
commodity rate page of a Bangla newspaper. Warm newsprint ground, exactly two spot
inks (ink black, vermilion), hairline column rules, halftone photo plates. The
contract lives as an HTML comment in `src/app/layout.tsx`.

Rejected and not to be reintroduced: the SaaS POS arrangement (gradient hero, angled
dashboard screenshot, three pastel feature cards, logo bar) and the Swiss-hairline
minimal page that preceded this build.

## Memorable moment

`ledger-demo.tsx` — selecting one sale row settles four ledgers (stock, customer,
takings, books) at once. It is the product's mechanism made literal and is the page's
single authored motion. It must never animate a value from invisible; the figure
stays on screen and settles.

## Language

Bangla is the default and the design target — line lengths, type scale and the matra
rule are set for Bengali script first. English is a toggle and must not be allowed to
drive the composition.

## Unresolved

- Currency symbol placement is inconsistent between the app (suffix, bn-BD CLDR:
  "12.00৳") and this page (prefix: "৳1,565"). One convention should win product-wide.
- No pricing story beyond "free to start"; when a paid tier exists this page needs a
  truthful answer to "free for how long?".

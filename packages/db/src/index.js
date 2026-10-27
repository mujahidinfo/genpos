// Shared database package — single source of truth for the Prisma schema and client.
// Plain JS (no build step) so both apps/web (Next.js) and apps/api (NestJS, ESM) can import it.
export * from "@prisma/client";

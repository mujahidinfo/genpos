import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@/lib/trpc/server";
import type { CurrentShop } from "@/server/api-types";

export const shopRouter = router({
  /** The active branch with business-wide currency/language. */
  get: protectedProcedure.query(({ ctx }) => ctx.api<CurrentShop>("/shop")),

  update: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        logo: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        currency: z.string().default("USD"),
        language: z.string().default("en"),
        taxRate: z.number().min(0).max(100).default(0),
        taxName: z.string().default("Tax"),
      }),
    )
    .mutation(({ input: { language, ...rest }, ctx }) =>
      ctx.api<CurrentShop>("/shop", {
        method: "PUT",
        body: { ...rest, ...(language === "en" || language === "bn" ? { language } : {}) },
      }),
    ),

  setLanguage: adminProcedure
    .input(z.object({ language: z.enum(["en", "bn"]) }))
    .mutation(({ input, ctx }) =>
      ctx.api<CurrentShop>("/shop/language", { method: "PATCH", body: input }),
    ),
});

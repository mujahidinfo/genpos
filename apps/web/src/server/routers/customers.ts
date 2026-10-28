import { z } from "zod";
import type { Customer } from "@genpos/db";
import { router, protectedProcedure, adminProcedure } from "@/lib/trpc/server";
import type { CustomerDetail, CustomerWithCount } from "@/server/api-types";

const customerFields = {
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
};

export const customersRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(({ input, ctx }) => ctx.api<CustomerWithCount[]>("/customers", { query: input })),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => ctx.api<CustomerDetail>(`/customers/${input.id}`)),

  create: protectedProcedure
    .input(z.object(customerFields))
    .mutation(({ input, ctx }) => ctx.api<Customer>("/customers", { method: "POST", body: input })),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: customerFields.name.optional(),
        email: customerFields.email,
        phone: customerFields.phone,
        address: customerFields.address,
      }),
    )
    .mutation(({ input: { id, ...data }, ctx }) =>
      ctx.api<Customer>(`/customers/${id}`, { method: "PATCH", body: data }),
    ),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => ctx.api<Customer>(`/customers/${input.id}`, { method: "DELETE" })),

  getByPhone: protectedProcedure
    .input(z.object({ phone: z.string() }))
    .query(({ input, ctx }) => ctx.api<Customer | null>("/customers/lookup", { query: input })),

  findOrCreate: protectedProcedure
    .input(z.object({ phone: z.string().min(1), name: z.string().min(1), email: z.string().email().optional() }))
    .mutation(({ input, ctx }) =>
      ctx.api<Customer>("/customers/find-or-create", { method: "POST", body: input }),
    ),
});

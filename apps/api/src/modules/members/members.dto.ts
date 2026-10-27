import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const roleSchema = z.enum(['OWNER', 'MANAGER', 'CASHIER', 'INVENTORY_MANAGER']);

export class AddMemberDto extends createZodDto(
  z.object({
    name: z.string().trim().min(1).max(100),
    email: z.email().transform((e) => e.trim().toLowerCase()),
    // Needed only when the person has no GenPOS account yet.
    password: z.string().min(8).max(200).optional(),
    role: roleSchema,
    // Pin the staff member to one branch; omit for all branches.
    shopId: z.string().optional(),
  }),
) {}

export class UpdateMemberDto extends createZodDto(
  z.object({
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
    shopId: z.string().nullable().optional(),
  }),
) {}

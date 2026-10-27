import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const roleSchema = z.enum(['ADMIN', 'CASHIER', 'INVENTORY_MANAGER']);

export class CreateUserDto extends createZodDto(
  z.object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(6),
    role: roleSchema,
  }),
) {}

export class UpdateUserDto extends createZodDto(
  z.object({
    name: z.string().min(1).optional(),
    role: roleSchema.optional(),
    isActive: z.boolean().optional(),
  }),
) {}

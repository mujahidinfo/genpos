import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class UpdateShopDto extends createZodDto(
  z.object({
    name: z.string().min(1),
    logo: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.email().optional(),
    currency: z.string().default('USD'),
    language: z.string().default('en'),
    taxRate: z.number().min(0).max(100).default(0),
    taxName: z.string().default('Tax'),
  }),
) {}

export class SetLanguageDto extends createZodDto(
  z.object({
    language: z.enum(['en', 'bn']),
  }),
) {}

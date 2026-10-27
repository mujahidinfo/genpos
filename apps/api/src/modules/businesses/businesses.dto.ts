import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const currency = z
  .string()
  .trim()
  .length(3)
  .transform((c) => c.toUpperCase());
const language = z.enum(['en', 'bn']);

/** Onboarding: one form creates the business and its first branch. */
export class CreateBusinessDto extends createZodDto(
  z.object({
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(200).optional(),
    currency: currency.default('BDT'),
    language: language.default('bn'),
  }),
) {}

export class CreateShopDto extends createZodDto(
  z.object({
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(200).optional(),
  }),
) {}

/** Settings for the active branch plus business-wide currency/language. */
export class UpdateShopDto extends createZodDto(
  z.object({
    name: z.string().trim().min(1).max(100).optional(),
    logo: z.string().optional(),
    address: z.string().trim().max(200).optional(),
    phone: z.string().trim().max(30).optional(),
    email: z.email().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    taxName: z.string().trim().min(1).max(30).optional(),
    allowNegativeStock: z.boolean().optional(),
    businessName: z.string().trim().min(1).max(100).optional(),
    currency: currency.optional(),
    language: language.optional(),
  }),
) {}

export class SetLanguageDto extends createZodDto(z.object({ language })) {}

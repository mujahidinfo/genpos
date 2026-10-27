import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export class ListCustomersQueryDto extends createZodDto(
  z.object({ search: z.string().optional() }),
) {}

export class CustomerLookupQueryDto extends createZodDto(
  z.object({ phone: z.string() }),
) {}

export class CreateCustomerDto extends createZodDto(customerSchema) {}

export class UpdateCustomerDto extends createZodDto(customerSchema.partial()) {}

export class FindOrCreateCustomerDto extends createZodDto(
  z.object({
    phone: z.string().min(1),
    name: z.string().min(1),
    email: z.email().optional(),
  }),
) {}

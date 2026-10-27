import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { daysQuerySchema } from '../../common/utils.js';

export class DaysQueryDto extends createZodDto(daysQuerySchema) {}

export class TopProductsQueryDto extends createZodDto(
  daysQuerySchema.extend({
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
});

export class CreateCategoryDto extends createZodDto(categorySchema) {}

export class UpdateCategoryDto extends createZodDto(categorySchema.partial()) {}

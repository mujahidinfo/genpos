import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class LoginDto extends createZodDto(
  z.object({
    email: z.email(),
    password: z.string().min(6),
  }),
) {}

export class RefreshTokenDto extends createZodDto(
  z.object({
    refreshToken: z.string().min(1),
  }),
) {}

export class ChangePasswordDto extends createZodDto(
  z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6),
  }),
) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const email = z.email().transform((e) => e.trim().toLowerCase());

export class RegisterDto extends createZodDto(
  z.object({
    name: z.string().trim().min(1).max(100),
    email,
    password: z.string().min(8, 'Use at least 8 characters').max(200),
  }),
) {}

export class LoginDto extends createZodDto(
  z.object({
    email,
    password: z.string().min(1),
  }),
) {}

export class GoogleSignInDto extends createZodDto(
  z.object({
    idToken: z.string().min(1),
  }),
) {}

export class RefreshTokenDto extends createZodDto(
  z.object({
    refreshToken: z.string().min(1),
  }),
) {}

export class ChangePasswordDto extends createZodDto(
  z.object({
    // Not needed when a Google-only account sets its first password.
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, 'Use at least 8 characters').max(200),
  }),
) {}

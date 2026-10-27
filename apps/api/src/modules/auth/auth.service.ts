import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@genpos/db';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import type { Env } from '../../config/env.js';
import type { AuthUser, JwtPayload } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ChangePasswordDto, LoginDto } from './auth.dto.js';

/**
 * Access tokens are short-lived JWTs. Refresh tokens are opaque random strings,
 * stored only as a SHA-256 hash in the `Session` table and rotated on every use.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { token: hashToken(refreshToken) },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: the presented refresh token is single-use. deleteMany (not delete)
    // so a concurrent refresh with the same token fails cleanly instead of 500ing.
    const { count } = await this.prisma.session.deleteMany({
      where: { id: session.id },
    });
    if (count === 0) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    return this.issueTokens(session.user);
  }

  async logout(refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: { token: hashToken(refreshToken) },
    });
    return { success: true };
  }

  async changePassword(userId: string, input: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const valid = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!valid) throw new UnauthorizedException('Current password incorrect');

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { success: true };
  }

  private async issueTokens(user: User) {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    const { exp } = this.jwt.decode<{ exp: number }>(accessToken);

    const refreshToken = randomBytes(48).toString('base64url');
    const ttlDays = this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });
    const refreshTokenExpiresAt = new Date(
      Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    );
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: hashToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
      },
    });

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return {
      tokenType: 'Bearer' as const,
      accessToken,
      accessTokenExpiresAt: new Date(exp * 1000),
      refreshToken,
      refreshTokenExpiresAt,
      user: authUser,
    };
  }
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

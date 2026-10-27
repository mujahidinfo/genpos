import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@genpos/db';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { createHash, randomBytes } from 'node:crypto';
import type { Env } from '../../config/env.js';
import type { AuthUser, JwtPayload } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  ChangePasswordDto,
  GoogleSignInDto,
  LoginDto,
  RegisterDto,
} from './auth.dto.js';

/**
 * Access tokens are short-lived JWTs. Refresh tokens are opaque random strings,
 * stored only as a SHA-256 hash in the `Session` table and rotated on every use.
 */
@Injectable()
export class AuthService {
  private readonly googleClientIds: string[];
  private readonly google = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.googleClientIds = config
      .get('GOOGLE_CLIENT_IDS', { infer: true })
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  async register({ name, email, password }: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(
        existing.googleId && !existing.passwordHash
          ? 'This email uses Google sign-in. Continue with Google instead.'
          : 'An account with this email already exists. Sign in instead.',
      );
    }
    const user = await this.prisma.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
    });
    return this.issueTokens(user);
  }

  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.passwordHash && user.googleId) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Continue with Google instead.',
      );
    }
    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  /**
   * Verifies a Google ID token (from the mobile/web Google SDK) and signs the
   * user in, creating the account on first use. An existing email account is
   * linked only when Google says the email is verified.
   */
  async googleSignIn({ idToken }: GoogleSignInDto) {
    if (this.googleClientIds.length === 0) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
    }

    let payload;
    try {
      const ticket = await this.google.verifyIdToken({
        idToken,
        audience: this.googleClientIds,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const email = payload.email.toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { googleId: payload.sub },
    });

    if (!user) {
      const byEmail = await this.prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        if (!payload.email_verified) {
          throw new ConflictException(
            'An account with this email already exists. Sign in with your password.',
          );
        }
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            googleId: payload.sub,
            avatarUrl: byEmail.avatarUrl ?? payload.picture,
          },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email,
            name: payload.name ?? email.split('@')[0],
            googleId: payload.sub,
            avatarUrl: payload.picture,
          },
        });
      }
    }

    if (!user.isActive) throw new UnauthorizedException('Account disabled');
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
    if (user.passwordHash) {
      const valid = await bcrypt.compare(
        input.currentPassword ?? '',
        user.passwordHash,
      );
      if (!valid) throw new UnauthorizedException('Current password incorrect');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(input.newPassword, 12) },
    });
    return { success: true };
  }

  private async issueTokens(user: User) {
    const payload: JwtPayload = { sub: user.id };
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
      avatarUrl: user.avatarUrl,
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

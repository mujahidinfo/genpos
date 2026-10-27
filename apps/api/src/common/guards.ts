import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { MemberRole } from '@genpos/db';
import { PrismaService } from '../prisma/prisma.service.js';
import { IS_PUBLIC_KEY, NO_TENANT_KEY, ROLES_KEY } from './decorators.js';
import {
  SHOP_HEADER,
  type AuthenticatedRequest,
  type JwtPayload,
} from './types.js';

function flag(reflector: Reflector, key: string, context: ExecutionContext) {
  return reflector.getAllAndOverride<boolean>(key, [
    context.getHandler(),
    context.getClass(),
  ]);
}

/** Global guard 1: requires a valid Bearer access token unless @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (flag(this.reflector, IS_PUBLIC_KEY, context)) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    // Re-check the user on every request so deactivation takes effect
    // immediately instead of when the access token expires.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive) throw new UnauthorizedException();

    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
    return true;
  }
}

/**
 * Global guard 2: resolves the active branch from the `X-Shop-Id` header and
 * checks the user's membership. Without the header, a user with exactly one
 * branch gets it automatically. Every tenant-scoped query reads
 * `request.tenant`, so data from other businesses is unreachable.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      flag(this.reflector, IS_PUBLIC_KEY, context) ||
      flag(this.reflector, NO_TENANT_KEY, context)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user!;
    const header = request.headers[SHOP_HEADER];
    const shopId = typeof header === 'string' && header ? header : undefined;

    const memberships = await this.prisma.membership.findMany({
      where: {
        userId: user.id,
        isActive: true,
        ...(shopId && { business: { shops: { some: { id: shopId } } } }),
      },
      include: {
        business: {
          select: {
            shops: {
              where: { isActive: true, ...(shopId && { id: shopId }) },
              select: { id: true },
            },
          },
        },
      },
    });

    // Branches this user may act in: all of the business's, or the one
    // their membership pins them to.
    const accessible = memberships.flatMap((m) =>
      m.business.shops
        .filter((s) => !m.shopId || m.shopId === s.id)
        .map((s) => ({ shopId: s.id, membership: m })),
    );

    if (shopId) {
      const match = accessible.find((a) => a.shopId === shopId);
      if (!match) throw new ForbiddenException('No access to this shop');
      request.tenant = {
        businessId: match.membership.businessId,
        shopId,
        role: match.membership.role,
      };
      return true;
    }

    if (accessible.length === 1) {
      const [only] = accessible;
      request.tenant = {
        businessId: only.membership.businessId,
        shopId: only.shopId,
        role: only.membership.role,
      };
      return true;
    }

    throw new BadRequestException(
      accessible.length === 0
        ? 'Create a shop first'
        : `Select a shop with the ${SHOP_HEADER} header`,
    );
  }
}

/** Global guard 3: enforces @Roles() against the membership role. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<MemberRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) return true;

    const { tenant } = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    if (!tenant || !roles.includes(tenant.role)) {
      throw new ForbiddenException();
    }
    return true;
  }
}

import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { MemberRole } from '@genpos/db';
import type { AuthenticatedRequest, AuthUser, TenantContext } from './types.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const NO_TENANT_KEY = 'noTenant';
export const ROLES_KEY = 'roles';

/** Owner + manager: can change settings, catalog, staff and see finance. */
export const MANAGERS: MemberRole[] = ['OWNER', 'MANAGER'];

/** Can edit the catalog and stock. */
export const CATALOG_EDITORS: MemberRole[] = [
  'OWNER',
  'MANAGER',
  'INVENTORY_MANAGER',
];

/** Skip authentication (and tenant resolution) for this route or controller. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Authenticated, but not tied to a branch — e.g. listing your businesses or
 * creating the first one during onboarding.
 */
export const NoTenant = () => SetMetadata(NO_TENANT_KEY, true);

/** Restrict a route or controller to the given membership roles. */
export const Roles = (...roles: MemberRole[]) => SetMetadata(ROLES_KEY, roles);

/** The authenticated user attached by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user!,
);

/** The active business/branch attached by TenantGuard. */
export const Tenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().tenant!,
);

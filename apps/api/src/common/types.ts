import type { Request } from 'express';
import type { MemberRole } from '@genpos/db';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type JwtPayload = {
  sub: string;
};

/** The business + branch a request operates on, resolved by TenantGuard. */
export type TenantContext = {
  businessId: string;
  shopId: string;
  role: MemberRole;
};

export type AuthenticatedRequest = Request & {
  user?: AuthUser;
  tenant?: TenantContext;
};

/** Header clients send to pick the active branch. */
export const SHOP_HEADER = 'x-shop-id';

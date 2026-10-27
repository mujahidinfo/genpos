import type { Request } from 'express';
import type { Role } from '@genpos/db';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type JwtPayload = {
  sub: string;
  role: Role;
};

export type AuthenticatedRequest = Request & { user?: AuthUser };

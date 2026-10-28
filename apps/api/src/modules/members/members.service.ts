import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type { AuthUser, TenantContext } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AddMemberDto, UpdateMemberDto } from './members.dto.js';

const memberInclude = {
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
  shop: { select: { id: true, name: true } },
  employee: {
    select: { id: true, salary: true, salaryType: true, payDay: true, isActive: true },
  },
} as const;

const ROLE_TITLE = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  INVENTORY_MANAGER: 'Inventory manager',
} as const;

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenant: TenantContext) {
    return this.prisma.membership.findMany({
      where: { businessId: tenant.businessId },
      include: memberInclude,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async add(tenant: TenantContext, input: AddMemberDto) {
    if (input.role === 'OWNER' && tenant.role !== 'OWNER') {
      throw new ForbiddenException('Only an owner can add another owner');
    }
    await this.assertShopInBusiness(tenant, input.shopId);

    let user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (user) {
      const existing = await this.prisma.membership.findUnique({
        where: {
          userId_businessId: { userId: user.id, businessId: tenant.businessId },
        },
      });
      if (existing) throw new ConflictException('Already a member');
    } else {
      if (!input.password) {
        throw new BadRequestException(
          'Set a password for this new staff account',
        );
      }
      user = await this.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash: await bcrypt.hash(input.password, 12),
        },
      });
    }

    const created = await this.prisma.membership.create({
      data: {
        userId: user.id,
        businessId: tenant.businessId,
        role: input.role,
        shopId: input.shopId,
      },
      include: memberInclude,
    });
    if (input.salary) {
      await this.syncPayroll(tenant, created.id, user.name, input.role, input.salary, input.payDay);
      return this.prisma.membership.findUniqueOrThrow({ where: { id: created.id }, include: memberInclude });
    }
    return created;
  }

  async update(
    tenant: TenantContext,
    actor: AuthUser,
    id: string,
    input: UpdateMemberDto,
  ) {
    const member = await this.prisma.membership.findFirstOrThrow({
      where: { id, businessId: tenant.businessId },
    });
    if (member.userId === actor.id && input.isActive === false) {
      throw new BadRequestException('Cannot deactivate yourself');
    }
    const touchesOwner = member.role === 'OWNER' || input.role === 'OWNER';
    if (touchesOwner && tenant.role !== 'OWNER') {
      throw new ForbiddenException('Only an owner can change owners');
    }
    if (
      member.role === 'OWNER' &&
      ((input.role && input.role !== 'OWNER') || input.isActive === false)
    ) {
      const owners = await this.prisma.membership.count({
        where: { businessId: tenant.businessId, role: 'OWNER', isActive: true },
      });
      if (owners <= 1) {
        throw new BadRequestException('A business needs at least one owner');
      }
    }
    await this.assertShopInBusiness(tenant, input.shopId);

    const { salary, payDay, ...access } = input;
    const updated = await this.prisma.membership.update({
      where: { id },
      data: access,
      include: memberInclude,
    });
    if (salary !== undefined || payDay !== undefined) {
      await this.syncPayroll(tenant, id, updated.user.name, updated.role, salary, payDay);
      return this.prisma.membership.findUniqueOrThrow({ where: { id }, include: memberInclude });
    }
    return updated;
  }

  /** Keep the payroll entry for this person in step with the salary typed on the staff form. */
  private async syncPayroll(
    tenant: TenantContext,
    membershipId: string,
    name: string,
    role: keyof typeof ROLE_TITLE,
    salary: number | null | undefined,
    payDay: number | undefined,
  ) {
    const existing = await this.prisma.employee.findUnique({ where: { membershipId } });
    if (salary === null || salary === 0) {
      if (existing) {
        await this.prisma.employee.update({ where: { id: existing.id }, data: { isActive: false } });
      }
      return;
    }
    if (existing) {
      await this.prisma.employee.update({
        where: { id: existing.id },
        data: {
          name,
          isActive: true,
          ...(salary !== undefined && { salary, salaryType: 'MONTHLY' as const }),
          ...(payDay !== undefined && { payDay }),
        },
      });
    } else if (salary) {
      await this.prisma.employee.create({
        data: {
          businessId: tenant.businessId,
          membershipId,
          name,
          position: ROLE_TITLE[role],
          salary,
          salaryType: 'MONTHLY',
          payDay: payDay ?? 1,
          joinDate: new Date(),
        },
      });
    }
  }

  private async assertShopInBusiness(
    tenant: TenantContext,
    shopId: string | null | undefined,
  ) {
    if (!shopId) return;
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, businessId: tenant.businessId },
    });
    if (!shop) throw new BadRequestException('Unknown shop');
  }
}

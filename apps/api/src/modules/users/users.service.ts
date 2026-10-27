import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type { AuthUser } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { CreateUserDto, UpdateUserDto } from './users.dto.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(input.password, 12);
    return this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      },
      select: publicUserSelect,
    });
  }

  update(id: string, input: UpdateUserDto, actor: AuthUser) {
    if (id === actor.id && input.isActive === false) {
      throw new BadRequestException('Cannot deactivate yourself');
    }
    return this.prisma.user.update({
      where: { id },
      data: input,
      select: publicUserSelect,
    });
  }
}

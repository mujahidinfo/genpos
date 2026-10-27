import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  MANAGERS,
  Roles,
  Tenant,
} from '../../common/decorators.js';
import type { AuthUser, TenantContext } from '../../common/types.js';
import { AddMemberDto, UpdateMemberDto } from './members.dto.js';
import { MembersService } from './members.service.js';

/** Staff accounts of the active business. */
@ApiTags('members')
@ApiBearerAuth()
@Roles(...MANAGERS)
@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list(@Tenant() tenant: TenantContext) {
    return this.members.list(tenant);
  }

  @Post()
  add(@Tenant() tenant: TenantContext, @Body() body: AddMemberDto) {
    return this.members.add(tenant, body);
  }

  @Patch(':id')
  update(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateMemberDto,
  ) {
    return this.members.update(tenant, user, id, body);
  }
}

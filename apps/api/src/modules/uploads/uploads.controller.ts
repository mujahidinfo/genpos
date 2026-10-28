import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  CATALOG_EDITORS,
  CurrentUser,
  NoTenant,
  Roles,
  Tenant,
} from '../../common/decorators.js';
import type { AuthUser, TenantContext } from '../../common/types.js';
import { UploadsService, type UploadedImage } from './uploads.service.js';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /** Multipart upload (`file` field) of a product photo; returns its public URL. */
  @Roles(...CATALOG_EDITORS)
  @Post('product-image')
  @HttpCode(201)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    }),
  )
  productImage(
    @Tenant() tenant: TenantContext,
    @UploadedFile() file: UploadedImage | undefined,
  ) {
    if (!file) throw new BadRequestException('Attach an image as "file"');
    return this.uploads.uploadProductImage(tenant, file);
  }

  /** Set the signed-in user's profile photo (any role, no branch needed). */
  @NoTenant()
  @Post('avatar')
  @HttpCode(201)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    }),
  )
  avatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: UploadedImage | undefined,
  ) {
    if (!file) throw new BadRequestException('Attach an image as "file"');
    return this.uploads.setAvatar(user.id, file);
  }

  @NoTenant()
  @Delete('avatar')
  removeAvatar(@CurrentUser() user: AuthUser) {
    return this.uploads.removeAvatar(user.id);
  }
}

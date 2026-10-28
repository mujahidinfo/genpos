import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UTApi, UTFile } from 'uploadthing/server';
import type { Env } from '../../config/env.js';
import type { TenantContext } from '../../common/types.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/** The parts of a multer in-memory file we use. */
export type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
]);

/**
 * Product photos are stored on UploadThing. Uploading through the API (rather
 * than straight from the app) reuses our auth and roles and keeps the
 * UploadThing token on the server.
 */
@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly utapi: UTApi | null;

  constructor(
    config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    const token = config.get('UPLOADTHING_TOKEN', { infer: true });
    this.utapi = token ? new UTApi({ token }) : null;
  }

  uploadProductImage(tenant: TenantContext, file: UploadedImage) {
    return this.store(file, `product-${Date.now()}`, tenant.businessId);
  }

  /** Store a profile photo and save it on the user in one step. */
  async setAvatar(userId: string, file: UploadedImage) {
    const { url } = await this.store(file, `avatar-${Date.now()}`, userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
    });
    return { url };
  }

  async removeAvatar(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
    return { url: null };
  }

  private async store(file: UploadedImage, name: string, owner: string) {
    if (!this.utapi) {
      throw new ServiceUnavailableException('Photo uploads are not set up yet');
    }
    if (!IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Use a JPEG, PNG or WebP photo');
    }

    const extension = file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const result = await this.utapi.uploadFiles(
      new UTFile(
        [new Uint8Array(file.buffer)],
        `${name}.${extension}`,
        {
          type: file.mimetype,
          // Lets the file be traced back to its owner in the UploadThing dashboard.
          customId: `${owner}-${crypto.randomUUID()}`,
        },
      ),
    );
    if (result.error) {
      this.logger.error(`UploadThing upload failed: ${result.error.message}`);
      throw new BadGatewayException('Could not store the photo. Try again.');
    }
    return { url: result.data.ufsUrl };
  }
}

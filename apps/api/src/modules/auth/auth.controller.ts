import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, NoTenant, Public } from '../../common/decorators.js';
import type { AuthUser } from '../../common/types.js';
import {
  ChangePasswordDto,
  GoogleSignInDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from './auth.dto.js';
import { AuthService } from './auth.service.js';

// Credential endpoints are public, so slow down guessing: 10 tries a minute per IP.
const credentialLimit = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(credentialLimit)
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register(body);
  }

  @Public()
  @Throttle(credentialLimit)
  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Public()
  @Throttle(credentialLimit)
  @Post('google')
  @HttpCode(200)
  google(@Body() body: GoogleSignInDto) {
    return this.auth.googleSignIn(body);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() body: RefreshTokenDto) {
    return this.auth.refresh(body.refreshToken);
  }

  /** Public so clients can log out even after the access token has expired. */
  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Body() body: RefreshTokenDto) {
    return this.auth.logout(body.refreshToken);
  }

  @ApiBearerAuth()
  @NoTenant()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @ApiBearerAuth()
  @NoTenant()
  @Patch('password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: ChangePasswordDto,
  ) {
    return this.auth.changePassword(user.id, body);
  }
}

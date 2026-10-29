import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { toOpenApiSchema } from '../common/openapi-schema.js';
import {
  userResponseSchema,
  type UserResponseDto,
} from '../user/dto/user-response.dto.js';
import { AuthService } from './auth.service.js';
import { loginSchema, type LoginDto } from './dto/login.dto.js';

const userResponseOpenApi = toOpenApiSchema(userResponseSchema);

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Signs in with email or username and password.
   *
   * Requires CSRF. Rate-limited. Sets a new session cookie on success.
   *
   * @param {LoginDto} loginDto - Identifier and password.
   * @param {Request} req - Current request (guest session).
   * @param {Response} res - Response for Set-Cookie.
   * @returns {Promise<UserResponseDto>} Public user profile (HTTP 200).
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Log in' })
  @ApiOkResponse({
    description: 'Authenticated; session cookie set.',
    schema: userResponseOpenApi,
  })
  @ApiBadRequestResponse({ description: 'Request body failed validation.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @ApiForbiddenResponse({ description: 'Invalid CSRF token.' })
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts.' })
  login(
    @Body({ schema: loginSchema }) loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    return this.authService.login(loginDto, req, res);
  }

  /**
   * Signs out by destroying the session and clearing the cookie.
   *
   * Requires CSRF.
   *
   * @param {Request} req - Current request.
   * @param {Response} res - Response that clears the cookie.
   * @returns {Promise<void>} HTTP 204.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Log out' })
  @ApiNoContentResponse({ description: 'Session cleared.' })
  @ApiForbiddenResponse({ description: 'Invalid CSRF token.' })
  logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    return this.authService.logout(req, res);
  }
}

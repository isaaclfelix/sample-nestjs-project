import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { z } from 'zod';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { UserOwnershipGuard } from '../auth/user-ownership.guard.js';
import { toOpenApiSchema } from '../common/openapi-schema.js';
import { UserService } from './user.service.js';
import { createUserSchema, type CreateUserDto } from './dto/create-user.dto.js';
import { updateUserSchema, type UpdateUserDto } from './dto/update-user.dto.js';
import {
  userResponseSchema,
  type UserResponseDto,
} from './dto/user-response.dto.js';

const userIdSchema = z.uuid();
const userResponseOpenApi = toOpenApiSchema(userResponseSchema);

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Creates a user from a validated request body.
   *
   * Public signup: CSRF and rate limit required; no authenticated session.
   * Delegates uniqueness, hashing, and persistence to UserService.
   *
   * @param {CreateUserDto} createUserDto - Signup payload after Zod validation.
   * @returns {Promise<UserResponseDto>} The created public user (HTTP 201).
   */
  @Post()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({
    description: 'User created.',
    schema: userResponseOpenApi,
  })
  @ApiBadRequestResponse({ description: 'Request body failed validation.' })
  @ApiConflictResponse({
    description: 'Email or username already in use.',
  })
  @ApiForbiddenResponse({ description: 'Invalid CSRF token.' })
  @ApiTooManyRequestsResponse({
    description: 'Too many registration attempts.',
  })
  create(
    @Body({ schema: createUserSchema }) createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

  /**
   * Fetches one user by UUID.
   *
   * @param {string} id - Path param; must be a UUID or the pipe returns 400.
   * @returns {Promise<UserResponseDto>} The public user (HTTP 200).
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponse({
    description: 'Public user profile.',
    schema: userResponseOpenApi,
  })
  @ApiBadRequestResponse({ description: 'Path id is not a valid UUID.' })
  @ApiNotFoundResponse({ description: 'No user exists for the given id.' })
  findOne(
    @Param('id', { schema: userIdSchema }) id: string,
  ): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  /**
   * Partially updates display name and/or password for the signed-in user.
   *
   * Requires CSRF, an authenticated session, and ownership of `:id`.
   * Email and username are not accepted on this body (strict schema).
   *
   * @param {string} id - Path param; must be a UUID or the pipe returns 400.
   * @param {UpdateUserDto} updateUserDto - At least one of displayName or password.
   * @returns {Promise<UserResponseDto>} The updated public user (HTTP 200).
   */
  @Patch(':id')
  @UseGuards(SessionAuthGuard, UserOwnershipGuard)
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({
    description: 'Updated public user profile.',
    schema: userResponseOpenApi,
  })
  @ApiBadRequestResponse({
    description: 'Path id or body failed validation.',
  })
  @ApiUnauthorizedResponse({ description: 'Not signed in.' })
  @ApiForbiddenResponse({
    description: 'Invalid CSRF token or not the resource owner.',
  })
  @ApiNotFoundResponse({ description: 'No user exists for the given id.' })
  update(
    @Param('id', { schema: userIdSchema }) id: string,
    @Body({ schema: updateUserSchema }) updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }

  /**
   * Deletes the signed-in user by UUID.
   *
   * Requires CSRF, session, and ownership. Always returns 204; missing users
   * are a no-op in the service.
   *
   * @param {string} id - Path param; must be a UUID or the pipe returns 400.
   * @returns {Promise<void>}
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SessionAuthGuard, UserOwnershipGuard)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiNoContentResponse({
    description: 'User deleted, or id was already absent.',
  })
  @ApiBadRequestResponse({ description: 'Path id is not a valid UUID.' })
  @ApiUnauthorizedResponse({ description: 'Not signed in.' })
  @ApiForbiddenResponse({
    description: 'Invalid CSRF token or not the resource owner.',
  })
  remove(@Param('id', { schema: userIdSchema }) id: string): Promise<void> {
    return this.userService.remove(id);
  }
}

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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
import { UserService } from './user.service.js';
import { createUserSchema, type CreateUserDto } from './dto/create-user.dto.js';
import { updateUserSchema, type UpdateUserDto } from './dto/update-user.dto.js';
import {
  userResponseSchema,
  type UserResponseDto,
} from './dto/user-response.dto.js';
import { toOpenApiSchema } from '../common/openapi-schema.js';

const userIdSchema = z.uuid();
const userResponseOpenApi = toOpenApiSchema(userResponseSchema);
const userResponseListOpenApi = {
  type: 'array' as const,
  items: userResponseOpenApi,
};

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Creates a user from a validated request body.
   *
   * Delegates uniqueness, hashing, and persistence to UserService.
   *
   * @param {CreateUserDto} createUserDto - Signup payload after Zod validation.
   * @returns {Promise<UserResponseDto>} The created public user (HTTP 201).
   */
  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({
    description: 'User created.',
    schema: userResponseOpenApi,
  })
  @ApiBadRequestResponse({ description: 'Request body failed validation.' })
  @ApiConflictResponse({
    description: 'Email or username already in use.',
  })
  create(
    @Body({ schema: createUserSchema }) createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

  /**
   * Lists all users.
   *
   * @returns {UserResponseDto[]} Public user records (HTTP 200).
   */
  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({
    description: 'All public users.',
    schema: userResponseListOpenApi,
  })
  findAll(): UserResponseDto[] {
    return this.userService.findAll();
  }

  /**
   * Fetches one user by UUID.
   *
   * @param {string} id - Path param; must be a UUID or the pipe returns 400.
   * @returns {UserResponseDto} The public user (HTTP 200).
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponse({
    description: 'Public user profile.',
    schema: userResponseOpenApi,
  })
  @ApiBadRequestResponse({ description: 'Path id is not a valid UUID.' })
  @ApiNotFoundResponse({ description: 'No user exists for the given id.' })
  findOne(@Param('id', { schema: userIdSchema }) id: string): UserResponseDto {
    return this.userService.findOne(id);
  }

  /**
   * Partially updates display name and/or password.
   *
   * Email and username are not accepted on this body (strict schema).
   *
   * @param {string} id - Path param; must be a UUID or the pipe returns 400.
   * @param {UpdateUserDto} updateUserDto - At least one of displayName or password.
   * @returns {Promise<UserResponseDto>} The updated public user (HTTP 200).
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({
    description: 'Updated public user profile.',
    schema: userResponseOpenApi,
  })
  @ApiBadRequestResponse({
    description: 'Path id or body failed validation.',
  })
  @ApiNotFoundResponse({ description: 'No user exists for the given id.' })
  update(
    @Param('id', { schema: userIdSchema }) id: string,
    @Body({ schema: updateUserSchema }) updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }

  /**
   * Deletes a user by UUID.
   *
   * Always returns 204; missing users are a no-op in the service.
   *
   * @param {string} id - Path param; must be a UUID or the pipe returns 400.
   * @returns {void}
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiNoContentResponse({
    description: 'User deleted, or id was already absent.',
  })
  @ApiBadRequestResponse({ description: 'Path id is not a valid UUID.' })
  remove(@Param('id', { schema: userIdSchema }) id: string): void {
    return this.userService.remove(id);
  }
}

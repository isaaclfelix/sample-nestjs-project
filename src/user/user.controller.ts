import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import { UserService } from './user.service.js';
import { createUserSchema, type CreateUserDto } from './dto/create-user.dto.js';
import { updateUserSchema, type UpdateUserDto } from './dto/update-user.dto.js';
import type { UserResponseDto } from './dto/user-response.dto.js';

const userIdSchema = z.uuid();

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
  remove(@Param('id', { schema: userIdSchema }) id: string): void {
    return this.userService.remove(id);
  }
}

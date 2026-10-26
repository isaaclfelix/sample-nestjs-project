import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { User } from './entities/user.entity.js';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../common/password.js';
import { toUserResponseDto } from './user.mapper.js';
import { USER_REPOSITORY, type UserRepository } from './user.repository.js';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  /**
   * Registers a new user and returns the public profile.
   *
   * Generates a UUID, hashes the password with Argon2id, and persists via the
   * repository. Email and username uniqueness is enforced by the database
   * (case-insensitive indexes). Extra properties on the DTO are not copied.
   *
   * @param {CreateUserDto} createUserDto - Validated signup fields (email, username, displayName, password).
   * @returns {Promise<UserResponseDto>} The created user without the password hash.
   * @throws {ConflictException} When the email or username is already taken.
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Build the stored user with generated id and hashed password; never copy extra DTO fields.
    const newUser: User = {
      id: randomUUID(),
      email: createUserDto.email,
      username: createUserDto.username,
      displayName: createUserDto.displayName,
      password: await hashPassword(createUserDto.password),
      verified: false,
    };

    // Persist; unique-index conflicts become ConflictException in the adapter.
    const stored = await this.users.create(newUser);

    // Return the newly created user as a UserResponseDto object.
    return toUserResponseDto(stored);
  }

  /**
   * Lists every stored user as a public DTO.
   *
   * Does not include password hashes.
   *
   * @returns {Promise<UserResponseDto[]>} All users, or an empty array when none exist.
   */
  async findAll(): Promise<UserResponseDto[]> {
    // Return all users as UserResponseDto objects.
    const all = await this.users.findAll();
    return all.map(toUserResponseDto);
  }

  /**
   * Loads a stored user by id or fails.
   *
   * Used by find/update so missing ids share one NotFoundException.
   *
   * @param {string} id - The user's UUID.
   * @returns {Promise<User>} The full stored user, including the password hash.
   * @throws {NotFoundException} When no user exists for `id`.
   */
  private async getById(id: string): Promise<User> {
    // Get the user from the repository.
    const user = await this.users.findById(id);

    // If the user is not found, throw a not found exception.
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Returns one user by id as a public DTO.
   *
   * @param {string} id - The user's UUID.
   * @returns {Promise<UserResponseDto>} Public user fields without the password hash.
   * @throws {NotFoundException} When no user exists for `id`.
   */
  async findOne(id: string): Promise<UserResponseDto> {
    // Return the user as a UserResponseDto object.
    return toUserResponseDto(await this.getById(id));
  }

  /**
   * Applies a partial update to display name and/or password.
   *
   * Email and username are not updated here. A new password is hashed before save.
   *
   * @param {string} id - The user's UUID.
   * @param {UpdateUserDto} updateUserDto - At least one of displayName or password.
   * @returns {Promise<UserResponseDto>} The updated public user.
   * @throws {NotFoundException} When no user exists for `id`.
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Ensure the user exists before writing so missing ids stay 404 (not adapter-dependent).
    await this.getById(id);

    const data: { displayName?: string; password?: string } = {};

    // Update the display name if it is provided.
    if (updateUserDto.displayName !== undefined) {
      data.displayName = updateUserDto.displayName;
    }

    // Update the password if it is provided.
    if (updateUserDto.password !== undefined) {
      data.password = await hashPassword(updateUserDto.password);
    }

    // Persist the partial update through the repository.
    const updatedUser = await this.users.update(id, data);

    // Return the updated user as a UserResponseDto object.
    return toUserResponseDto(updatedUser);
  }

  /**
   * Deletes a user by id if present.
   *
   * Missing ids are ignored so HTTP DELETE can always return 204.
   *
   * @param {string} id - The user's UUID.
   * @returns {Promise<void>}
   */
  async remove(id: string): Promise<void> {
    // Remove the user; missing ids are a no-op (DELETE is always 204).
    await this.users.delete(id);
  }
}

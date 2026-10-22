import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { User } from './entities/user.entity.js';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../common/password.js';
import { toUserResponseDto } from './user.mapper.js';

@Injectable()
export class UserService {
  private readonly users: Map<string, User> = new Map();

  /**
   * Registers a new user and returns the public profile.
   *
   * Generates a UUID, hashes the password with Argon2id, and stores the document
   * in the in-memory map. Email and username must be unique (case-insensitive).
   * Extra properties on the DTO are not copied onto the stored user.
   *
   * @param {CreateUserDto} createUserDto - Validated signup fields (email, username, displayName, password).
   * @returns {Promise<UserResponseDto>} The created user without the password hash.
   * @throws {ConflictException} When the email or username is already taken.
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Reject duplicate email or username (case-insensitive) before inserting.
    this.assertUnique(createUserDto.email, createUserDto.username);

    // Build the stored user with generated id and hashed password; never copy extra DTO fields.
    const newUser: User = {
      id: randomUUID(),
      email: createUserDto.email,
      username: createUserDto.username,
      displayName: createUserDto.displayName,
      password: await hashPassword(createUserDto.password),
      verified: false,
    };

    // Add the new user to the map.
    this.users.set(newUser.id, newUser);

    // Return the newly created user as a UserResponseDto object.
    return toUserResponseDto(newUser);
  }

  /**
   * Lists every stored user as a public DTO.
   *
   * Does not include password hashes. Order follows Map insertion order.
   *
   * @returns {UserResponseDto[]} All users, or an empty array when none exist.
   */
  findAll(): UserResponseDto[] {
    // Return all users as UserResponseDto objects.
    return [...this.users.values()].map(toUserResponseDto);
  }

  /**
   * Loads a stored user by id or fails.
   *
   * Used by find/update so missing ids share one NotFoundException.
   *
   * @param {string} id - The user's UUID.
   * @returns {User} The full stored document, including the password hash.
   * @throws {NotFoundException} When no user exists for `id`.
   */
  private getById(id: string): User {
    // Get the user from the map.
    const user = this.users.get(id);

    // If the user is not found, throw a not found exception.
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Ensures email and username are not already taken.
   *
   * Comparison is case-insensitive so `Ada` and `ada` conflict. The values
   * already stored keep their original casing.
   *
   * @param {string} email - Candidate email address.
   * @param {string} username - Candidate handle (without a leading @).
   * @returns {void}
   * @throws {ConflictException} When email or username matches an existing user.
   */
  private assertUnique(email: string, username: string): void {
    // Compare using lowercase so Ada and ada cannot both exist; stored casing is unchanged.
    const emailKey = email.toLowerCase();
    const usernameKey = username.toLowerCase();

    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === emailKey) {
        throw new ConflictException('Email already in use');
      }
      if (user.username.toLowerCase() === usernameKey) {
        throw new ConflictException('Username already in use');
      }
    }
  }

  /**
   * Returns one user by id as a public DTO.
   *
   * @param {string} id - The user's UUID.
   * @returns {UserResponseDto} Public user fields without the password hash.
   * @throws {NotFoundException} When no user exists for `id`.
   */
  findOne(id: string): UserResponseDto {
    // Return the user as a UserResponseDto object.
    return toUserResponseDto(this.getById(id));
  }

  /**
   * Applies a partial update to display name and/or password.
   *
   * Copies the stored user first so the previous DTO snapshot is unchanged.
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
    // Get the user from the map.
    const user = this.getById(id);

    // Copy fields explicitly so we do not spread a class instance.
    const updatedUser: User = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      password: user.password,
      verified: user.verified,
    };

    // Update the display name if it is provided.
    if (updateUserDto.displayName !== undefined) {
      updatedUser.displayName = updateUserDto.displayName;
    }

    // Update the password if it is provided.
    if (updateUserDto.password !== undefined) {
      updatedUser.password = await hashPassword(updateUserDto.password);
    }

    // Update the user in the map.
    this.users.set(id, updatedUser);

    // Return the updated user as a UserResponseDto object.
    return toUserResponseDto(updatedUser);
  }

  /**
   * Deletes a user by id if present.
   *
   * Missing ids are ignored so HTTP DELETE can always return 204.
   *
   * @param {string} id - The user's UUID.
   * @returns {void}
   */
  remove(id: string): void {
    // Remove the user from the map. Missing ids are a no-op (DELETE is always 204).
    this.users.delete(id);
  }
}

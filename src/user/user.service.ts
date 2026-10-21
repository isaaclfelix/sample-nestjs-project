import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Generate random UUID (for now).
    const id = randomUUID();

    // Process password.
    const { password: plaintextPassword, ...userData } = createUserDto;

    // Enhance new user object with generated ID, processed password and verified flag.
    const newUser: User = {
      id,
      ...userData,
      password: await hashPassword(plaintextPassword),
      verified: false,
    };

    // Add the new user to the map.
    this.users.set(id, newUser);

    // Return the newly created user as a UserResponseDto object.
    return toUserResponseDto(newUser);
  }

  findAll(): UserResponseDto[] {
    // Return all users as UserResponseDto objects.
    return [ ...this.users.values() ].map(toUserResponseDto);
  }

  private getById(id: string): User {
    const user = this.users.get(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  findOne(id: string): UserResponseDto {
    // Get the user from the map.
    const user = this.getById(id);

    // Return the user as a UserResponseDto object.
    return toUserResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Get the user from the map.
    const user = this.getById(id);

    // Create a new user object with the updated properties.
    const updatedUser: User = { ...user };

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

  remove(id: string) {
    // Remove the user from the map.
    this.users.delete(id);
  }
}

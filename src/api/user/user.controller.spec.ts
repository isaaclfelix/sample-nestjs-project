import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { UserResponseDto } from './dto/user-response.dto.js';

const publicUser: UserResponseDto = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'ada@example.com',
  username: 'Ada_Lovelace',
  displayName: 'Ada Lovelace',
  verified: false,
};

describe('UserController', () => {
  let controller: UserController;
  const userService = {
    create: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
      ],
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get(UserController);
  });

  it('delegates create to the service', async () => {
    userService.create.mockResolvedValue(publicUser);
    const dto = {
      email: publicUser.email,
      username: publicUser.username,
      displayName: publicUser.displayName,
      password: 'correct-horse',
    };

    await expect(controller.create(dto)).resolves.toEqual(publicUser);
    expect(userService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates findOne to the service', async () => {
    userService.findOne.mockResolvedValue(publicUser);

    await expect(controller.findOne(publicUser.id)).resolves.toEqual(
      publicUser,
    );
  });

  it('delegates update to the service', async () => {
    userService.update.mockResolvedValue({
      ...publicUser,
      displayName: 'Augusta',
    });

    await expect(
      controller.update(publicUser.id, { displayName: 'Augusta' }),
    ).resolves.toMatchObject({ displayName: 'Augusta' });
    expect(userService.update).toHaveBeenCalledWith(publicUser.id, {
      displayName: 'Augusta',
    });
  });

  it('delegates remove to the service', async () => {
    userService.remove.mockResolvedValue(undefined);
    await controller.remove(publicUser.id);
    expect(userService.remove).toHaveBeenCalledWith(publicUser.id);
  });

  it('declares 204 for the delete handler', () => {
    const handler = Object.getOwnPropertyDescriptor(
      UserController.prototype,
      'remove',
    )?.value as ((id: string) => Promise<void>) | undefined;
    const httpCode = Reflect.getMetadata('__httpCode__', handler as object);
    expect(httpCode).toBe(HttpStatus.NO_CONTENT);
  });
});

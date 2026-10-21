import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
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
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
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
      password: 'password1',
    };

    await expect(controller.create(dto)).resolves.toEqual(publicUser);
    expect(userService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates findAll and findOne to the service', () => {
    userService.findAll.mockReturnValue([publicUser]);
    userService.findOne.mockReturnValue(publicUser);

    expect(controller.findAll()).toEqual([publicUser]);
    expect(controller.findOne(publicUser.id)).toEqual(publicUser);
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

  it('delegates remove to the service', () => {
    controller.remove(publicUser.id);
    expect(userService.remove).toHaveBeenCalledWith(publicUser.id);
  });

  it('declares 204 for the delete handler', () => {
    const httpCode = Reflect.getMetadata(
      '__httpCode__',
      UserController.prototype.remove,
    );
    expect(httpCode).toBe(HttpStatus.NO_CONTENT);
  });
});

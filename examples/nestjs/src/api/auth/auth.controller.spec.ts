import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { UserResponseDto } from '../user/dto/user-response.dto.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

const publicUser: UserResponseDto = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'ada@example.com',
  username: 'Ada_Lovelace',
  displayName: 'Ada Lovelace',
  verified: false,
};

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    login: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
      ],
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('delegates login to the service', async () => {
    authService.login.mockResolvedValue(publicUser);
    const dto = { identifier: 'ada@example.com', password: 'correct-horse' };
    const req = {} as Request;
    const res = {} as Response;

    await expect(controller.login(dto, req, res)).resolves.toEqual(publicUser);
    expect(authService.login).toHaveBeenCalledWith(dto, req, res);
  });

  it('delegates logout to the service', async () => {
    authService.logout.mockResolvedValue(undefined);
    const req = {} as Request;
    const res = {} as Response;

    await expect(controller.logout(req, res)).resolves.toBeUndefined();
    expect(authService.logout).toHaveBeenCalledWith(req, res);
  });
});

import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { USER_REPOSITORY } from './user.repository.js';
import { PrismaUserRepository } from './prisma-user.repository.js';
import { PrismaService } from '../../persistence/prisma.service.js';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useFactory: (prisma: PrismaService): PrismaUserRepository =>
        new PrismaUserRepository(prisma),
      inject: [PrismaService],
    },
  ],
})
export class UserModule {}

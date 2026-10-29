import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { CsrfGuard } from './csrf.guard.js';
import './express-augmentation.js';
import { SessionService } from './session.service.js';
import { UserModule } from '../user/user.module.js';

/**
 * Session persistence, CSRF enforcement, and login/logout HTTP routes.
 *
 * Global so SessionMiddleware (registered in AppModule) can inject
 * SessionService. CsrfGuard is registered as a global APP_GUARD. Auth routes
 * are mounted under `/api` via RouterModule.
 */
@Global()
@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [
    SessionService,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
  exports: [SessionService],
})
export class AuthModule {}

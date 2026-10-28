import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard.js';
import './express-augmentation.js';
import { SessionService } from './session.service.js';

/**
 * Session persistence and CSRF enforcement for the JSON API and SSR pages.
 *
 * Global so SessionMiddleware (registered in AppModule) and feature modules
 * can inject SessionService. CsrfGuard is registered as a global APP_GUARD.
 */
@Global()
@Module({
  providers: [
    SessionService,
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
  exports: [SessionService],
})
export class AuthModule {}

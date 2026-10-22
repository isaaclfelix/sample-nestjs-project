import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { ApiModule } from './api/api.module.js';
import { AppController } from './api/app.controller.js';
import { AppService } from './api/app.service.js';
import { UserModule } from './api/user/user.module.js';
import { LoggerMiddleware } from './logger.middleware.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: process.env?.OBSERVE_APP_KEY ?? '',
      appSecret: process.env?.OBSERVE_APP_SECRET ?? '',
      serviceId: 'sample-nestjs-project',
    }),
    ApiModule,
    // Prefix the module that owns the user controllers. AppController stays
    // on this module so GET / keeps returning the greeting until the page
    // layer takes that path.
    RouterModule.register([
      {
        path: 'api',
        children: [{ path: '/', module: UserModule }],
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  /**
   * Applies request logging to every route.
   *
   * Runs for HTML pages and the JSON API. The middleware calls through so
   * it does not end the request.
   *
   * @param {MiddlewareConsumer} consumer - Nest middleware registry for this module.
   * @returns {void}
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

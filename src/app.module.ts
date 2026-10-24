import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { ApiModule } from './api/api.module.js';
import { UserModule } from './api/user/user.module.js';
import { LoggerMiddleware } from './logger.middleware.js';
import { WebModule } from './web/web.module.js';

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
    WebModule,
    // ApiModule owns the greeting and the user controllers, so both sit under /api.
    RouterModule.register([
      {
        path: 'api',
        module: ApiModule,
        children: [{ path: '/', module: UserModule }],
      },
    ]),
  ],
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

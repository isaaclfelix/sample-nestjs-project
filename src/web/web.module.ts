import { Module } from '@nestjs/common';
import { WebController } from './web.controller.js';
import { WebViewService } from './web-view.service.js';

@Module({
  controllers: [WebController],
  providers: [WebViewService],
})
export class WebModule {}

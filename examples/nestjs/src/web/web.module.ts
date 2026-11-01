import { Module } from '@nestjs/common';
import { ArchipielagoModule } from '@archipielago/nestjs/archipielago.module.js';
import { WebController } from './web.controller.js';
import { pageStylesheetsByPage } from './page-stylesheets.js';

@Module({
  imports: [
    ArchipielagoModule.forRoot({
      getPageStylesheets: (page: string) =>
        pageStylesheetsByPage[page as keyof typeof pageStylesheetsByPage],
    }),
  ],
  controllers: [WebController],
})
export class WebModule {}

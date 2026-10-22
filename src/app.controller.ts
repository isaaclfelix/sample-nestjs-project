import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Returns a fixed hello string for the root health-style route.
   *
   * @returns {string} The greeting from AppService.
   */
  @Get()
  @ApiOperation({ summary: 'Hello World' })
  @ApiOkResponse({
    description: 'Plain-text greeting.',
    schema: { type: 'string', example: 'Hello World!' },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}

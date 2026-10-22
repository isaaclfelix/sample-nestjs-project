import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { HomePageProps } from './pages/home-page.props.js';
import { WebViewService } from './web-view.service.js';

@Controller()
@ApiExcludeController()
export class WebController {
  constructor(private readonly webViewService: WebViewService) {}

  /**
   * Renders the home page as HTML.
   *
   * Passes a page name and plain props so this file does not import React.
   * The timestamp is generated here because it is request data, not view logic.
   *
   * @returns {Promise<string>} Full HTML document (HTTP 200, text/html).
   */
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  home(): Promise<string> {
    const props: HomePageProps = {
      renderedAt: new Date().toISOString(),
    };

    return this.webViewService.render('home', props);
  }
}

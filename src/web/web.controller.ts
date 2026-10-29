import { Controller, Get, Header, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { AppSession } from '../api/auth/session.js';
import type { HomePageSsrProps } from './protocol/page-props/home-page.ssr-props.js';
import type { LoginPageSsrProps } from './protocol/page-props/login-page.ssr-props.js';
import type { RegisterPageSsrProps } from './protocol/page-props/register-page.ssr-props.js';
import { WebViewService } from './web-view.service.js';

/** Express request after SessionMiddleware may have attached a session. */
type RequestWithSession = Request & { session?: AppSession };

@Controller()
@ApiExcludeController()
export class WebController {
  constructor(private readonly webViewService: WebViewService) {}

  /**
   * Renders the home page as HTML.
   *
   * Passes a page name and SSR embed props so this file does not import React.
   * The timestamp is generated here because it is request data, not view logic.
   *
   * @param {RequestWithSession} req - Request with session from SessionMiddleware.
   * @returns {Promise<string>} Full HTML document (HTTP 200, text/html).
   */
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  home(@Req() req: RequestWithSession): Promise<string> {
    const props: HomePageSsrProps = {
      renderedAt: new Date().toISOString(),
      isAuthenticated: Boolean(req.session?.userId),
    };

    return this.webViewService.render('home', props, {
      csrfToken: req.session?.csrfToken,
    });
  }

  /**
   * Renders the login page as HTML, or redirects authenticated users home.
   *
   * Form interactivity hydrates via the login-form island. Form CSS comes from
   * the opt-in forms sibling stylesheet for this page.
   *
   * @param {RequestWithSession} req - Request with session from SessionMiddleware.
   * @param {Response} res - Response used for guest-only redirects.
   * @returns {Promise<string | void>} Full HTML document, or void after redirect.
   */
  @Get('login')
  @Header('Content-Type', 'text/html; charset=utf-8')
  login(
    @Req() req: RequestWithSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> | void {
    if (req.session?.userId) {
      res.redirect('/');
      return;
    }

    const props: LoginPageSsrProps = {
      isAuthenticated: false,
    };

    return this.webViewService.render('login', props, {
      csrfToken: req.session?.csrfToken,
    });
  }

  /**
   * Renders the register page as HTML, or redirects authenticated users home.
   *
   * Form interactivity hydrates via the register-form island. Form CSS comes
   * from the opt-in forms sibling stylesheet for this page.
   *
   * @param {RequestWithSession} req - Request with session from SessionMiddleware.
   * @param {Response} res - Response used for guest-only redirects.
   * @returns {Promise<string | void>} Full HTML document, or void after redirect.
   */
  @Get('register')
  @Header('Content-Type', 'text/html; charset=utf-8')
  register(
    @Req() req: RequestWithSession,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> | void {
    if (req.session?.userId) {
      res.redirect('/');
      return;
    }

    const props: RegisterPageSsrProps = {
      isAuthenticated: false,
    };

    return this.webViewService.render('register', props, {
      csrfToken: req.session?.csrfToken,
    });
  }
}

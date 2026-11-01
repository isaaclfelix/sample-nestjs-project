import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { Document } from '../../../../src/web/ui/server-components/document/document.js';
import { chooseShellDelivery } from './shell-css-delivery.js';
import type { AssetTags } from './asset-tags.js';

describe('chooseShellDelivery', () => {
  it('inlines when raw CSS fits the budget', () => {
    const css = '.ok{color:red}';
    const budget = Buffer.byteLength(css, 'utf8');

    expect(chooseShellDelivery(css, budget)).toEqual({
      mode: 'inline',
      css,
    });
  });

  it('links when raw CSS exceeds the budget', () => {
    const budget = 8;
    const css = 'x'.repeat(budget + 1);

    expect(chooseShellDelivery(css, budget)).toEqual({ mode: 'link' });
  });

  it('flips mode when the budget changes for fixed CSS', () => {
    const css = 'body{margin:0}';
    const raw = Buffer.byteLength(css, 'utf8');

    expect(chooseShellDelivery(css, raw).mode).toBe('inline');
    expect(chooseShellDelivery(css, raw - 1).mode).toBe('link');
  });
});

describe('Document shell delivery', () => {
  it('emits a style tag and no shell link when inlining', () => {
    const assets: AssetTags = {
      stylesheets: [],
      scripts: [],
      inlineStyles: [{ id: 'shell', css: '.shell{color:navy}' }],
    };

    const html = renderToString(
      createElement(Document, { assets, children: null }),
    );

    expect(html).toContain('data-css="shell"');
    expect(html).toContain('.shell{color:navy}');
    expect(html).not.toContain('rel="stylesheet"');
  });

  it('emits a stylesheet link and no shell style when linking', () => {
    const assets: AssetTags = {
      stylesheets: ['/assets/shell.css'],
      scripts: [],
      inlineStyles: [],
    };

    const html = renderToString(
      createElement(Document, { assets, children: null }),
    );

    expect(html).toContain('href="/assets/shell.css"');
    expect(html).not.toContain('data-css="shell"');
  });
});

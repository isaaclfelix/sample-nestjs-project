import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import type { AssetTags } from '@archipielago/core/page-assets.js';
import { Document } from './document';

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

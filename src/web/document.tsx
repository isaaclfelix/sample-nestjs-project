import type { ReactElement, ReactNode } from 'react';
import type { AssetTags } from './asset-tags.js';

/**
 * Renders the HTML document around a page.
 *
 * Head may include linked stylesheets and/or inlined `<style>` blocks (shell).
 * An empty asset list leaves the page as server HTML with no client bundle.
 *
 * @param {{ children: ReactNode; assets: AssetTags }} props - Page body and asset URLs.
 * @returns {ReactElement} The `<html>` tree, without a doctype.
 */
export function Document({
  children,
  assets,
}: {
  children: ReactNode;
  assets: AssetTags;
}): ReactElement {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Sample</title>
        {assets.inlineStyles.map(({ id, css }) => (
          <style key={id} data-css={id}>
            {css}
          </style>
        ))}
        {assets.stylesheets.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>
        {children}
        {assets.scripts.map((src) => (
          <script key={src} type="module" src={src} />
        ))}
      </body>
    </html>
  );
}

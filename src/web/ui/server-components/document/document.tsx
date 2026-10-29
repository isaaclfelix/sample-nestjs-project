import type { ReactElement, ReactNode } from 'react';
import type { AssetTags } from '../../../protocol/page-assets';

/**
 * Renders the HTML document around a page.
 *
 * Head may include linked stylesheets and/or inlined `<style>` blocks (shell).
 * An empty asset list leaves the page as server HTML with no client bundle.
 * When `csrfToken` is set, embeds a Laravel-style meta tag for mutating fetches.
 *
 * @param {{ children: ReactNode; assets: AssetTags; csrfToken?: string }} props - Page body, assets, optional CSRF.
 * @returns {ReactElement} The `<html>` tree, without a doctype.
 */
export function Document({
  children,
  assets,
  csrfToken,
}: {
  children: ReactNode;
  assets: AssetTags;
  csrfToken?: string;
}): ReactElement {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {csrfToken !== undefined ? (
          <meta name="csrf-token" content={csrfToken} />
        ) : null}
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

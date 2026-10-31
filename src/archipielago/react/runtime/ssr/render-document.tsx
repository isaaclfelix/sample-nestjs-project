import type { ComponentType, ReactElement, ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import type { IslandName } from '../../../core/islands';
import type { PageAssets } from '../../../core/page-assets';
import type { RenderResult } from '../../../core/render-result';
import { IslandCssContext, IslandNamesContext } from '../island/island';

/**
 * Props for the product document shell around a rendered page.
 */
export interface DocumentShellProps {
  children: ReactNode;
  assets: PageAssets['tags'];
  csrfToken?: string;
}

/**
 * Options for the Nest-free two-pass document render.
 */
export interface RenderDocumentOptions {
  /** Renders the selected page (app supplies the component + props). */
  renderPage: () => ReactElement;
  /** Product HTML document shell (title, branding, asset slots). */
  Document: ComponentType<DocumentShellProps>;
  /** Builds tags and island CSS after the name-collection pass. */
  createAssets: (islandNames: string[]) => PageAssets | Promise<PageAssets>;
  /** Optional CSRF token embedded by the document shell. */
  csrfToken?: string;
}

/**
 * Renders a page tree to a full HTML document via two-pass SSR.
 *
 * Pass 1 collects island names. Pass 2 uses framework-built page assets and
 * emits sibling island `<style>` tags. The product {@link Document} stays
 * injectable; Archipielago owns the document contract (doctype + asset wiring).
 *
 * @param {RenderDocumentOptions} options - Page factory, Document, assets.
 * @returns {Promise<RenderResult>} Full document HTML plus the asset bag used.
 */
export async function renderDocument(
  options: RenderDocumentOptions,
): Promise<RenderResult> {
  const { renderPage, Document, createAssets, csrfToken } = options;
  const islandNames = new Set<string>();

  // First pass records island names. Asset URLs depend on that set.
  renderToString(
    <IslandNamesContext.Provider value={islandNames}>
      {renderPage()}
    </IslandNamesContext.Provider>,
  );

  const assets = await createAssets([...islandNames]);
  const { tags, islandCss } = assets;
  const emitted = new Set<IslandName>();

  const markup = renderToString(
    <IslandCssContext.Provider value={{ cssByName: islandCss, emitted }}>
      <Document assets={tags} csrfToken={csrfToken}>
        {renderPage()}
      </Document>
    </IslandCssContext.Provider>,
  );

  return {
    html: `<!DOCTYPE html>${markup}`,
    assets,
  };
}

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assetTagsFromManifest,
  developmentAssetTags,
  developmentShellOnlyAssetTags,
  pageStylesheetHrefs,
  shellStylesheetFromManifest,
  type AssetTags,
  type ClientManifest,
} from './asset-tags.js';
import {
  isIslandName,
  type IslandName,
  islandCssModuleUrl,
} from './island-runtime/registry.js';
import type { PageStylesheetName } from './page-stylesheets.js';
import { chooseShellDelivery } from './shell-css-delivery.js';
import { shellCssBudgetBytes } from './vite-shell-css-budget.js';

/**
 * Document tags plus island CSS text for SSR sibling `<style>` tags.
 */
export interface PageAssets {
  tags: AssetTags;
  islandCss: Readonly<Partial<Record<IslandName, string>>>;
}

/** Absolute directory that holds production client assets. */
function clientOutDir(): string {
  return join(process.cwd(), 'dist/client');
}

/**
 * Reads the built shell CSS text from the client output.
 *
 * @param {ClientManifest} manifest - Vite client manifest.
 * @returns {string} Uncompressed CSS source.
 * @throws {Error} When the shell file cannot be resolved or read.
 */
export function loadShellCssText(manifest: ClientManifest): string {
  const href = shellStylesheetFromManifest(manifest);
  const relative = href.replace(/^\//, '');
  return readFileSync(join(clientOutDir(), relative), 'utf8');
}

/**
 * Builds production shell tags: inline under budget, otherwise a stylesheet link.
 *
 * @param {ClientManifest} manifest - Vite client manifest.
 * @param {string} cssText - Built shell CSS.
 * @param {number} budgetBytes - Raw-byte inline budget.
 * @returns {Pick<AssetTags, 'stylesheets' | 'inlineStyles'>} Shell-only style delivery.
 */
export function shellStyleTags(
  manifest: ClientManifest,
  cssText: string,
  budgetBytes: number,
): Pick<AssetTags, 'stylesheets' | 'inlineStyles'> {
  const delivery = chooseShellDelivery(cssText, budgetBytes);
  const shellHref = shellStylesheetFromManifest(manifest);

  if (delivery.mode === 'inline') {
    return {
      stylesheets: [],
      inlineStyles: [{ id: 'shell', css: delivery.css }],
    };
  }

  return {
    stylesheets: [shellHref],
    inlineStyles: [],
  };
}

/**
 * Loads island CSS text from production manifest `css` arrays.
 *
 * @param {ClientManifest} manifest - Vite client manifest.
 * @param {readonly string[]} islandNames - Islands rendered on the page.
 * @returns {Partial<Record<IslandName, string>>} CSS keyed by island name.
 */
export function islandCssFromManifest(
  manifest: ClientManifest,
  islandNames: readonly string[],
): Partial<Record<IslandName, string>> {
  const out: Partial<Record<IslandName, string>> = {};

  for (const rawName of islandNames) {
    if (!isIslandName(rawName)) {
      continue;
    }

    const chunk = manifest[`src/web/islands/${rawName}.tsx`];
    const files = chunk?.css ?? [];

    if (files.length === 0) {
      continue;
    }

    // Join every CSS asset listed for the island entry (usually one module).
    out[rawName] = files
      .map((file) => readFileSync(join(clientOutDir(), file), 'utf8'))
      .join('\n');
  }

  return out;
}

/**
 * Enough of Vite to transform a module stylesheet URL in development.
 */
export interface IslandCssTransformer {
  transformRequest(
    url: string,
  ): Promise<{ code: string; map?: unknown } | null | undefined>;
}

/**
 * Loads island CSS in development via Vite transform of each module path.
 *
 * @param {readonly string[]} islandNames - Islands on the page.
 * @param {IslandCssTransformer} vite - Middleware-mode Vite server.
 * @returns {Promise<Partial<Record<IslandName, string>>>} Transformed CSS text.
 */
export async function islandCssFromVite(
  islandNames: readonly string[],
  vite: IslandCssTransformer,
): Promise<Partial<Record<IslandName, string>>> {
  const out: Partial<Record<IslandName, string>> = {};

  for (const rawName of islandNames) {
    if (!isIslandName(rawName)) {
      continue;
    }

    const moduleUrl = islandCssModuleUrl(rawName);

    if (!moduleUrl) {
      continue;
    }

    const result = await vite.transformRequest(moduleUrl);

    if (result?.code) {
      // Vite may wrap CSS modules as JS; strip to CSS when needed.
      out[rawName] = extractCssFromViteModule(result.code);
    }
  }

  return out;
}

/**
 * Pulls CSS text out of a Vite transform result.
 *
 * Plain CSS transforms return CSS. CSS-module transforms may return a JS
 * module that embeds the CSS as a string — recover that string when present.
 *
 * @param {string} code - Vite `transformRequest` code.
 * @returns {string} CSS suitable for a `<style>` tag.
 */
export function extractCssFromViteModule(code: string): string {
  // CSS module JS often contains: const __vite__css = "...";
  const viteCss = /const\s+__vite__css\s*=\s*("(?:\\.|[^"\\])*")/.exec(code);

  if (viteCss?.[1]) {
    return JSON.parse(viteCss[1]) as string;
  }

  // Already CSS (no JS module wrapper).
  if (
    !code.includes('import.meta') &&
    !code.trimStart().startsWith('import ') &&
    !code.includes('export default')
  ) {
    return code;
  }

  return '';
}

/**
 * Appends opt-in page stylesheet links to asset tags.
 *
 * @param {AssetTags} tags - Shell / hydrate tags.
 * @param {readonly PageStylesheetName[]} pageStylesheets - Sheets this page opted into.
 * @param {{ development: boolean; manifest?: ClientManifest }} source - Asset source.
 * @returns {AssetTags} Tags with page sibling `<link>` hrefs appended.
 */
function withPageStylesheets(
  tags: AssetTags,
  pageStylesheets: readonly PageStylesheetName[],
  source: { development: boolean; manifest?: ClientManifest },
): AssetTags {
  const hrefs = pageStylesheetHrefs(pageStylesheets, source);

  if (hrefs.length === 0) {
    return tags;
  }

  return {
    ...tags,
    stylesheets: [...tags.stylesheets, ...hrefs],
  };
}

/**
 * Builds tags and island CSS for one page render.
 *
 * Development keeps the shell as a `<link>` for HMR. Production may inline
 * the shell when under the raw-byte budget. Opt-in page siblings (e.g. forms)
 * are always head `<link>`s when the page declares them. Island CSS is always
 * resolved for SSR sibling `<style>` tags in both environments.
 *
 * @param {readonly string[]} islandNames - Islands collected on the first SSR pass.
 * @param {{ development: boolean; manifest?: ClientManifest; vite?: IslandCssTransformer; pageStylesheets?: readonly PageStylesheetName[] }} source - Asset source.
 * @returns {Promise<PageAssets>} Document tags and island CSS map.
 */
export async function createPageAssets(
  islandNames: readonly string[],
  source: {
    development: boolean;
    manifest?: ClientManifest;
    vite?: IslandCssTransformer;
    pageStylesheets?: readonly PageStylesheetName[];
  },
): Promise<PageAssets> {
  const pageStylesheets = source.pageStylesheets ?? [];

  if (source.development) {
    const base =
      islandNames.length === 0
        ? developmentShellOnlyAssetTags()
        : developmentAssetTags();
    const tags = withPageStylesheets(base, pageStylesheets, {
      development: true,
    });

    const islandCss = source.vite
      ? await islandCssFromVite(islandNames, source.vite)
      : {};

    return { tags, islandCss };
  }

  if (!source.manifest) {
    throw new Error('Production pages need the client manifest.');
  }

  const cssText = loadShellCssText(source.manifest);
  const shell = shellStyleTags(source.manifest, cssText, shellCssBudgetBytes());
  const islandCss = islandCssFromManifest(source.manifest, islandNames);
  const pageLinks = {
    development: false as const,
    manifest: source.manifest,
  };

  if (islandNames.length === 0) {
    return {
      tags: withPageStylesheets(
        {
          stylesheets: shell.stylesheets,
          inlineStyles: shell.inlineStyles,
          scripts: [],
        },
        pageStylesheets,
        pageLinks,
      ),
      islandCss,
    };
  }

  const runtime = assetTagsFromManifest(source.manifest);
  const shellHref = shellStylesheetFromManifest(source.manifest);

  return {
    tags: withPageStylesheets(
      {
        stylesheets: [
          ...shell.stylesheets,
          ...runtime.stylesheets.filter((href) => href !== shellHref),
        ],
        inlineStyles: shell.inlineStyles,
        scripts: runtime.scripts,
      },
      pageStylesheets,
      pageLinks,
    ),
    islandCss,
  };
}

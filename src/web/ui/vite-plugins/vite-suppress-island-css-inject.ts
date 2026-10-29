import type { Plugin } from 'vite';

/**
 * Island name from a Vite module id for
 * `src/web/ui/islands/<name>/<name>.module.{css,scss}`.
 *
 * @param {string} id - Vite transform id (may include query string).
 * @returns {string | undefined} Kebab island name, or undefined when not an island module.
 */
export function islandNameFromCssModuleId(id: string): string | undefined {
  const path = id.split('?')[0] ?? id;
  const match =
    /\/islands\/([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\/\1\.module\.s?css$/i.exec(
      path.replace(/\\/g, '/'),
    );
  return match?.[1];
}

/**
 * Rewrites Vite's client CSS injectors to reuse SSR sibling `<style data-css-island>`.
 *
 * Without this, `/@vite/client` inserts a second copy in `<head>` (`data-vite-dev-id`)
 * when the island chunk imports its CSS module. HMR still updates the sibling tag.
 *
 * @param {string} code - Vite CSS-module client transform output.
 * @param {string} islandName - Registry / `data-css-island` name.
 * @returns {string} Code that prefers the sibling style over head injection.
 */
export function rewriteIslandCssClientInject(
  code: string,
  islandName: string,
): string {
  if (
    !code.includes('__vite__updateStyle') ||
    code.includes('data-css-island-hmr')
  ) {
    return code;
  }

  // Only kebab names from the filesystem; safe inside a CSS attribute selector.
  const selector = `style[data-css-island="${islandName}"]`;

  // Leading `;` is required: the prior line is `const __vite__css = "..."`.
  // Without it, ASI treats `(...)(...)` as calling that string (not a function).
  const update = code.replace(
    /__vite__updateStyle\((__vite__id), (__vite__css)\)/g,
    `;(($id, $css) => { /* data-css-island-hmr */ const el = document.querySelector(${JSON.stringify(selector)}); if (el) { el.textContent = $css; return; } __vite__updateStyle($id, $css); })($1, $2)`,
  );

  return update.replace(
    /__vite__removeStyle\((__vite__id)\)/g,
    `(($id) => { const el = document.querySelector(${JSON.stringify(selector)}); if (el) return; __vite__removeStyle($id); })($1)`,
  );
}

/**
 * Dev-only: keep island CSS on the SSR sibling tag; do not inject a head duplicate.
 *
 * @returns {Plugin} Vite serve plugin.
 */
export function suppressIslandCssClientInject(): Plugin {
  return {
    name: 'suppress-island-css-client-inject',
    apply: 'serve',
    enforce: 'post',
    transform(code, id, options): { code: string; map: null } | undefined {
      // SSR module graph must keep Vite's default CSS handling.
      if (options?.ssr) {
        return undefined;
      }

      const islandName = islandNameFromCssModuleId(id);

      if (!islandName) {
        return undefined;
      }

      const next = rewriteIslandCssClientInject(code, islandName);

      if (next === code) {
        return undefined;
      }

      return { code: next, map: null };
    },
  };
}

/**
 * In-repo path roots for Archipielago engines and this Nest sample app.
 *
 * Phase 1 keeps a single mutable defaults object (no workspace packages yet).
 * Hosts and tests may override via {@link setArchipielagoPaths}.
 */

/**
 * Relative and Vite-dev roots the host, assets, and island helpers share.
 */
export interface ArchipielagoPaths {
  /** Repo-relative product islands directory. */
  islandsDirRel: string;
  /** Absolute-from-root Vite URL prefix for island modules. */
  islandsDirDevPrefix: string;
  /** Manifest / Vite input for the shell stylesheet. */
  shellStylesheetSource: string;
  /** Vite-dev URL for the shell stylesheet. */
  shellStylesheetDev: string;
  /** Manifest / Vite input for the hydrate entry. */
  hydrateEntrySource: string;
  /** Vite-dev URL for the hydrate entry. */
  hydrateEntryDev: string;
  /** Vite `ssrLoadModule` URL for the app SSR entry. */
  entryServerDev: string;
  /** Repo-relative SSR entry source (Vitest / tooling). */
  entryServerSourceRel: string;
  /** Repo-relative production SSR bundle. */
  entryServerProdRel: string;
  /** Repo-relative Vite client output directory. */
  clientOutDirRel: string;
  /** Repo-relative Vite client manifest. */
  clientManifestRel: string;
  /** Repo-relative generated islands map. */
  islandsGeneratedRel: string;
  /** Manifest / Vite input for the forms sibling sheet. */
  formsStylesheetSource: string;
  /** Vite-dev URL for the forms sibling sheet. */
  formsStylesheetDev: string;
}

/**
 * Defaults for this repository's Nest sample layout.
 */
export const defaultArchipielagoPaths: ArchipielagoPaths = {
  islandsDirRel: 'src/web/ui/islands',
  islandsDirDevPrefix: '/src/web/ui/islands',
  shellStylesheetSource: 'src/web/ui/styles/shell.scss',
  shellStylesheetDev: '/src/web/ui/styles/shell.scss',
  hydrateEntrySource: 'src/archipielago/react/runtime/island/hydrate.tsx',
  hydrateEntryDev: '/src/archipielago/react/runtime/island/hydrate.tsx',
  entryServerDev: '/src/web/ui/runtime/ssr/entry-server.tsx',
  entryServerSourceRel: 'src/web/ui/runtime/ssr/entry-server.tsx',
  entryServerProdRel: 'dist/web-server/entry-server.js',
  clientOutDirRel: 'dist/client',
  clientManifestRel: 'dist/client/.vite/manifest.json',
  islandsGeneratedRel: 'src/web/protocol/islands.generated.ts',
  formsStylesheetSource: 'src/web/ui/styles/forms.scss',
  formsStylesheetDev: '/src/web/ui/styles/forms.scss',
};

let archipielagoPaths: ArchipielagoPaths = { ...defaultArchipielagoPaths };

/**
 * Returns the active path roots for Archipielago engines.
 *
 * @returns {ArchipielagoPaths} Current path configuration.
 */
export function getArchipielagoPaths(): ArchipielagoPaths {
  return archipielagoPaths;
}

/**
 * Replaces or merges path roots; pass `undefined` to restore defaults.
 *
 * @param {Partial<ArchipielagoPaths> | undefined} paths - Overrides, or clear.
 * @returns {void}
 */
export function setArchipielagoPaths(
  paths: Partial<ArchipielagoPaths> | undefined,
): void {
  archipielagoPaths =
    paths === undefined
      ? { ...defaultArchipielagoPaths }
      : { ...archipielagoPaths, ...paths };
}

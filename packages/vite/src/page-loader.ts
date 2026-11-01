import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { getArchipielagoPaths } from '@archipielago/core/paths.js';
import type {
  PagePropsMap,
  ServerEntry,
} from '@archipielago/core/server-entry.js';

export type { PagePropsMap, ServerEntry };

/**
 * Enough of a Vite dev server to load the SSR module and transform CSS.
 *
 * The full ViteDevServer satisfies this. Tests can pass a stub.
 */
export interface ServerEntryLoader {
  ssrLoadModule(url: string): Promise<unknown>;
  transformRequest?(
    url: string,
  ): Promise<{ code: string; map?: unknown } | null | undefined>;
}

let viteDevServer: ServerEntryLoader | undefined;

/**
 * Remembers the dev server created during bootstrap.
 *
 * Call with `undefined` when the process is shutting down or a test needs a
 * clean loader. Production never sets this.
 *
 * @param {ServerEntryLoader | undefined} server - Middleware-mode Vite server, or undefined to clear it.
 * @returns {void}
 */
export function setViteDevServer(server: ServerEntryLoader | undefined): void {
  viteDevServer = server;
}

/**
 * Returns the dev server registered for this process.
 *
 * @returns {ServerEntryLoader | undefined} The Vite server, when bootstrap registered one.
 */
export function getViteDevServer(): ServerEntryLoader | undefined {
  return viteDevServer;
}

/**
 * Loads the React server entry for the current runtime.
 *
 * Dev uses Vite so Node never parses TSX. Tests import the source file
 * through Vitest's transformer. Production imports the built bundle. The
 * specifier is built at runtime so `nest build` does not compile the TSX.
 *
 * @template {PagePropsMap} TPages - Host page props map.
 * @param {{ vite?: ServerEntryLoader; vitest: boolean }} env - Which runtime is active. `vite` wins over `vitest`.
 * @param {(specifier: string) => Promise<ServerEntry<TPages>>} [load] - Importer. Tests pass a stub. The default is a dynamic import.
 * @returns {Promise<ServerEntry<TPages>>} The module that renders a page to HTML.
 */
export async function loadServerEntry<
  TPages extends PagePropsMap = PagePropsMap,
>(
  env: { vite?: ServerEntryLoader; vitest: boolean },
  load: (specifier: string) => Promise<ServerEntry<TPages>> = (specifier) =>
    import(specifier),
): Promise<ServerEntry<TPages>> {
  const paths = getArchipielagoPaths();

  // Dev SSR goes through Vite. A static import would make tsc emit the TSX.
  if (env.vite) {
    // Vite types the module as a record. The entry's render export is the contract.
    return env.vite.ssrLoadModule(paths.entryServerDev) as Promise<
      ServerEntry<TPages>
    >;
  }

  // Runtime string so TypeScript does not follow the import into the views.
  const specifier = env.vitest
    ? pathToFileURL(join(process.cwd(), paths.entryServerSourceRel)).href
    : pathToFileURL(join(process.cwd(), paths.entryServerProdRel)).href;

  return load(specifier);
}

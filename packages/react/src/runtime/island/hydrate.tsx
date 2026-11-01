import { createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { decodeIslandProps } from './island-props';
import { getIslandLoaders, isIslandName } from './registry';

/**
 * Hydrates each island marker in `root`.
 *
 * Loads only the chunks named in the document. Other registered islands
 * stay unrequested. The marker element is the container, not part of the
 * component tree. Callers must {@link registerIslands} before this runs
 * (app hydrate entry or test setup).
 *
 * @param {ParentNode} [root] - Document or fragment to scan. Defaults to `document`.
 * @returns {Promise<void>} Resolves when every marker on the page has been hydrated.
 * @throws {Error} When a marker names an island that is not in the registry.
 */
export async function hydrateIslands(
  root: ParentNode = document,
): Promise<void> {
  const islandLoaders = getIslandLoaders();
  const nodes = [...root.querySelectorAll<HTMLElement>('[data-island]')];

  await Promise.all(
    nodes.map(async (node) => {
      const name = node.dataset.island ?? '';

      if (!isIslandName(name)) {
        throw new Error(`Unknown island: ${String(name)}`);
      }

      const load = islandLoaders[name];
      if (load === undefined) {
        throw new Error(`Unknown island: ${name}`);
      }

      const props = decodeIslandProps(node.dataset.props ?? '');
      const islandModule = await load();

      hydrateRoot(node, createElement(islandModule.default, props));
    }),
  );
}

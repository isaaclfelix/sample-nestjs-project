import { createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { decodeIslandProps } from '../island-props.js';
import { isIslandName, islandLoaders } from '../islands/registry.js';

/**
 * Hydrates each island marker in `root`.
 *
 * Loads only the chunks named in the document. Other registered islands
 * stay unrequested. The marker element is the container, not part of the
 * component tree.
 *
 * @param {ParentNode} [root] - Document or fragment to scan. Defaults to `document`.
 * @returns {Promise<void>} Resolves when every marker on the page has been hydrated.
 * @throws {Error} When a marker names an island that is not in the registry.
 */
export async function hydrateIslands(
  root: ParentNode = document,
): Promise<void> {
  const nodes = [...root.querySelectorAll<HTMLElement>('[data-island]')];

  await Promise.all(
    nodes.map(async (node) => {
      const name = node.dataset.island ?? '';

      if (!isIslandName(name)) {
        throw new Error(`Unknown island: ${name}`);
      }

      const props = decodeIslandProps(node.dataset.props ?? '');
      const islandModule = await islandLoaders[name]();

      hydrateRoot(node, createElement(islandModule.default, props));
    }),
  );
}

await hydrateIslands();

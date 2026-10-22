import {
  createContext,
  useContext,
  type ComponentType,
  type Context,
  type ReactElement,
} from 'react';
import { encodeIslandProps } from '../island-props.js';
import type { IslandName } from './registry.js';

/**
 * Collects island names during the first server render pass.
 *
 * The second pass renders the document and does not need the set.
 */
export const IslandNamesContext: Context<Set<string> | null> =
  createContext<Set<string> | null>(null);

/**
 * Marks a client island and renders it on the server.
 *
 * The marker element stays outside the hydrated tree. The browser hydrates
 * `component` inside it with the same props.
 *
 * @param {{ name: IslandName; component: ComponentType<P>; props: P }} props - Island name, component, and JSON props.
 * @returns {ReactElement} Server HTML for the island plus its marker attributes.
 */
export function Island<P extends object>({
  name,
  component: Component,
  props,
}: {
  name: IslandName;
  component: ComponentType<P>;
  props: P;
}): ReactElement {
  const names = useContext(IslandNamesContext);

  // First pass records the name so the shell can skip the client script when unused.
  if (names) {
    names.add(name);
  }

  return (
    <div data-island={name} data-props={encodeIslandProps(props)}>
      <Component {...props} />
    </div>
  );
}

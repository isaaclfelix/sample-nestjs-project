import {
  createContext,
  useContext,
  type ComponentType,
  type Context,
  type ReactElement,
} from 'react';
import { encodeIslandProps } from './island-props';
import type { IslandName } from './registry';

/**
 * Collects island names during the first server render pass.
 *
 * The second pass renders the document and does not need the set.
 */
export const IslandNamesContext: Context<Set<string> | null> =
  createContext<Set<string> | null>(null);

/** CSS text keyed by island name; empty / missing name => no `<style>`. */
export type IslandCssByName = Readonly<Partial<Record<IslandName, string>>>;

/**
 * Framework-owned CSS map for SSR sibling `<style>` tags.
 *
 * Page authors never write into this. `createPageAssets` fills `cssByName`
 * after the name-collection pass; `entry-server` provides the context.
 */
export interface IslandCssContextValue {
  cssByName: IslandCssByName;
  /** Names that already emitted `<style>` in this document render. */
  emitted: Set<IslandName>;
}

/**
 * Island CSS for the second SSR pass. Null on the name-collection pass.
 */
export const IslandCssContext: Context<IslandCssContextValue | null> =
  createContext<IslandCssContextValue | null>(null);

/**
 * Marks a client island and renders it on the server.
 *
 * When `IslandCssContext` has CSS for `name`, emits a sibling
 * `<style data-css-island>` above the marker (once per name per document).
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
  const islandCss = useContext(IslandCssContext);

  // First pass records the name so the shell can skip the client script when unused.
  if (names) {
    names.add(name);
  }

  let styleTag: ReactElement | null = null;
  const cssText = islandCss?.cssByName[name];

  if (
    islandCss &&
    cssText !== undefined &&
    cssText !== '' &&
    !islandCss.emitted.has(name)
  ) {
    islandCss.emitted.add(name);
    styleTag = <style data-css-island={name}>{cssText}</style>;
  }

  return (
    <>
      {styleTag}
      <div data-island={name} data-props={encodeIslandProps(props)}>
        <Component {...props} />
      </div>
    </>
  );
}

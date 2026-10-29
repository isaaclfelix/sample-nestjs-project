/**
 * Scaffolds an SSR page stub or interactive island under `src/web/`.
 *
 * Shared by humans (`pnpm scaffold:web-ui`) and the `create-web-ui` agent skill.
 * Prefer this script over hand-wiring so registry / CSS module paths stay consistent.
 *
 * Usage:
 *   pnpm scaffold:web-ui --name my-widget --mode island --with-styles
 *   pnpm scaffold:web-ui --name about --mode page
 *   pnpm scaffold:web-ui   # interactive
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { stdin as input, stdout as output } from 'node:process';

/** CLI / interactive answers before validation. */
export interface ScaffoldAnswers {
  name: string;
  mode: 'page' | 'island';
  withStyles: boolean;
}

/** Validated plan the writer applies (or tests assert). */
export interface ScaffoldPlan {
  name: string;
  mode: 'page' | 'island';
  withStyles: boolean;
  pascalName: string;
  pageComponentPath: string;
  pagePropsPath: string;
  islandComponentPath: string;
  islandModulePath: string | undefined;
  cssModulePath: string | undefined;
}

/**
 * Converts a kebab-case name to PascalCase for React components.
 *
 * @param {string} kebab - e.g. `my-widget`.
 * @returns {string} e.g. `MyWidget`.
 */
export function kebabToPascal(kebab: string): string {
  return kebab
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Validates answers and returns paths relative to the repo root.
 *
 * Rejects `--mode page --with-styles` (SSR-only must use the shell, not a module).
 * Rejects non-kebab names.
 *
 * @param {ScaffoldAnswers} answers - Raw CLI or prompt answers.
 * @returns {ScaffoldPlan} Paths and names ready to write.
 * @throws {Error} When validation fails.
 */
export function resolveScaffoldPlan(answers: ScaffoldAnswers): ScaffoldPlan {
  const name = answers.name.trim();
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
    throw new Error(
      `Invalid --name "${answers.name}". Use kebab-case (e.g. my-widget).`,
    );
  }

  if (answers.mode !== 'page' && answers.mode !== 'island') {
    throw new Error(
      `Invalid --mode "${String(answers.mode)}". Use page or island.`,
    );
  }

  if (answers.mode === 'page' && answers.withStyles) {
    throw new Error(
      'Cannot use --with-styles with --mode page. SSR-only UI uses shell classes only (see docs/how-to-web-ui.md).',
    );
  }

  const pascalName = kebabToPascal(name);
  const withStyles = answers.mode === 'island' && answers.withStyles;

  return {
    name,
    mode: answers.mode,
    withStyles,
    pascalName,
    pageComponentPath: `src/web/pages/${name}-page.tsx`,
    pagePropsPath: `src/web/pages/${name}-page.props.ts`,
    islandComponentPath: `src/web/islands/${name}.tsx`,
    islandModulePath: withStyles
      ? `src/web/islands/${name}.module.scss`
      : undefined,
    cssModulePath: withStyles
      ? `/src/web/islands/${name}.module.scss`
      : undefined,
  };
}

/**
 * Parses argv flags for non-interactive scaffolding.
 *
 * @param {string[]} argv - Process args after the script name.
 * @returns {Partial<ScaffoldAnswers> & { help?: boolean }} Parsed flags.
 */
export function parseScaffoldArgs(
  argv: string[],
): Partial<ScaffoldAnswers> & { help?: boolean } {
  const result: Partial<ScaffoldAnswers> & { help?: boolean } = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }
    if (arg === '--with-styles') {
      result.withStyles = true;
      continue;
    }
    if (arg === '--name') {
      result.name = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--mode') {
      const mode = argv[i + 1];
      if (mode === 'page' || mode === 'island') {
        result.mode = mode;
      } else {
        throw new Error(`Invalid --mode "${mode ?? ''}". Use page or island.`);
      }
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return result;
}

/**
 * Builds page stub source (shell classes only; no CSS module).
 *
 * @param {ScaffoldPlan} plan - Validated plan.
 * @returns {{ props: string; component: string }} File contents.
 */
function pageSources(plan: ScaffoldPlan): { props: string; component: string } {
  const propsName = `${plan.pascalName}PageProps`;
  const componentName = `${plan.pascalName}Page`;

  const props = `/**
 * Props for the server-rendered ${plan.name} page.
 *
 * Kept in a TypeScript file so the Nest controller can type the object
 * without importing a TSX component.
 */
export interface ${propsName} {
  /** Replace with real request-derived fields. */
  title: string;
}
`;

  const component = `import type { ReactElement } from 'react';
import type { ${propsName} } from './${plan.name}-page.props.js';

/**
 * Renders the ${plan.name} page body.
 *
 * Server-only: this component is not part of the client bundle.
 * Style with shell classes from \`styles/shell.scss\` only — do not import a CSS module.
 *
 * Wire into \`ssr/entry-server.tsx\` pages map and a \`WebController\` method next.
 *
 * @param {${propsName}} props - Props from the controller.
 * @returns {ReactElement} The page body, without the document shell.
 */
export function ${componentName}({ title }: ${propsName}): ReactElement {
  return (
    <main className="container py-4">
      <h1>{title}</h1>
      {/* Shell classes only — see docs/how-to-web-ui.md */}
    </main>
  );
}
`;

  return { props, component };
}

/**
 * Builds island component (and optional module) source.
 *
 * @param {ScaffoldPlan} plan - Validated plan.
 * @returns {{ component: string; moduleCss: string | undefined }} File contents.
 */
function islandSources(plan: ScaffoldPlan): {
  component: string;
  moduleCss: string | undefined;
} {
  const importStyles = plan.withStyles
    ? `import styles from './${plan.name}.module.scss';\n`
    : '';
  const className = plan.withStyles
    ? ` className={styles.root}`
    : ' className="btn btn-primary"';

  const component = `import { useState, type ReactElement } from 'react';
${importStyles}
/**
 * Interactive ${plan.name} island.
 *
 * Default export required for hydrate. Props must be JSON-serializable.
 * Register in \`islandRegistry\` / \`islandLoaders\` (scaffold does this).
 * Render with \`<Island name="${plan.name}" component={${plan.pascalName}} props={…} />\`.
 *
 * @param {{ label?: string }} props - Optional label from the server.
 * @returns {ReactElement} Interactive island markup.
 */
export default function ${plan.pascalName}({
  label = '${plan.pascalName}',
}: {
  label?: string;
}): ReactElement {
  const [ready, setReady] = useState(false);

  return (
    <button
      type="button"${className}
      onClick={() => setReady((value) => !value)}
    >
      {ready ? \`\${label} ready\` : label}
    </button>
  );
}
`;

  const moduleCss = plan.withStyles
    ? `// Island-owned interaction styles. Keep small — not a second design system.
// Use tokens for Sass API only; never re-import the shell sheet.

@import '../styles/tokens';

.root {
  // Interaction-specific rules (hover, open state, spinner, …).
  &:hover {
    opacity: 0.9;
  }
}
`
    : undefined;

  return { component, moduleCss };
}

/**
 * Inserts a loader function and registry entries for a new island.
 *
 * @param {string} registrySource - Current `registry.ts` text.
 * @param {ScaffoldPlan} plan - Validated plan.
 * @returns {string} Updated registry source.
 */
export function patchIslandRegistry(
  registrySource: string,
  plan: ScaffoldPlan,
): string {
  if (
    registrySource.includes(`function load${plan.pascalName}Island`) ||
    new RegExp(`^\\s*${plan.name}:`, 'm').test(registrySource)
  ) {
    throw new Error(
      `Island "${plan.name}" already looks registered in registry.ts`,
    );
  }

  const loaderFn = `
/**
 * Loads the ${plan.name} island chunk.
 *
 * @returns {Promise<IslandModule>} The ${plan.name} module.
 */
function load${plan.pascalName}Island(): Promise<IslandModule> {
  return import('../islands/${plan.name}.js') as Promise<IslandModule>;
}
`;

  const registrationMarker = '/**\n * One registered island:';
  if (!registrySource.includes(registrationMarker)) {
    throw new Error(
      'Could not find IslandRegistration marker in registry.ts to insert loader',
    );
  }

  // Insert the new loader immediately before the registration interface block.
  let next = registrySource.replace(
    registrationMarker,
    `${loaderFn}${registrationMarker}`,
  );

  const cssLine = plan.cssModulePath
    ? `\n    cssModulePath: '${plan.cssModulePath}',`
    : '';

  const registryEntry = `  ${plan.name}: {
    load: load${plan.pascalName}Island,${cssLine}
  },
`;

  next = next.replace(
    /(export const islandRegistry = \{[\s\S]*?)(\} as const satisfies)/,
    `$1${registryEntry}$2`,
  );

  next = next.replace(
    /(export const islandLoaders = \{[\s\S]*?)(\} as const;)/,
    `$1  ${plan.name}: load${plan.pascalName}Island,\n$2`,
  );

  return next;
}

/**
 * Writes scaffold files under `rootDir` and patches the island registry when needed.
 *
 * @param {string} rootDir - Repository root.
 * @param {ScaffoldPlan} plan - Validated plan.
 * @returns {Promise<string[]>} Absolute paths written or updated.
 */
export async function applyScaffoldPlan(
  rootDir: string,
  plan: ScaffoldPlan,
): Promise<string[]> {
  const written: string[] = [];

  if (plan.mode === 'page') {
    const { props, component } = pageSources(plan);
    const propsAbs = join(rootDir, plan.pagePropsPath);
    const componentAbs = join(rootDir, plan.pageComponentPath);

    if (existsSync(propsAbs) || existsSync(componentAbs)) {
      throw new Error(
        `Page files already exist for "${plan.name}" under src/web/pages/`,
      );
    }

    await mkdir(dirname(propsAbs), { recursive: true });
    await writeFile(propsAbs, props, 'utf8');
    await writeFile(componentAbs, component, 'utf8');
    written.push(propsAbs, componentAbs);
    return written;
  }

  const { component, moduleCss } = islandSources(plan);
  const componentAbs = join(rootDir, plan.islandComponentPath);
  if (existsSync(componentAbs)) {
    throw new Error(`Island file already exists: ${plan.islandComponentPath}`);
  }
  if (plan.islandModulePath) {
    const moduleAbs = join(rootDir, plan.islandModulePath);
    if (existsSync(moduleAbs)) {
      throw new Error(`CSS module already exists: ${plan.islandModulePath}`);
    }
  }

  await mkdir(dirname(componentAbs), { recursive: true });
  await writeFile(componentAbs, component, 'utf8');
  written.push(componentAbs);

  if (moduleCss && plan.islandModulePath) {
    const moduleAbs = join(rootDir, plan.islandModulePath);
    await writeFile(moduleAbs, moduleCss, 'utf8');
    written.push(moduleAbs);
  }

  const registryAbs = join(rootDir, 'src/web/island-runtime/registry.ts');
  const registryBefore = await readFile(registryAbs, 'utf8');
  const registryAfter = patchIslandRegistry(registryBefore, plan);
  await writeFile(registryAbs, registryAfter, 'utf8');
  written.push(registryAbs);

  return written;
}

/**
 * Prints usage for `--help` or incomplete interactive sessions.
 *
 * @returns {void}
 */
function printHelp(): void {
  output.write(`Usage:
  pnpm scaffold:web-ui --name <kebab> --mode page|island [--with-styles]
  pnpm scaffold:web-ui   # interactive

--with-styles is allowed only with --mode island (adds *.module.scss + cssModulePath).
See docs/how-to-web-ui.md for the decision tree.
`);
}

/**
 * Prompts for name, mode, and optional styles when flags are incomplete.
 *
 * @param {Partial<ScaffoldAnswers>} partial - Flags already provided.
 * @returns {Promise<ScaffoldAnswers>} Complete answers.
 */
async function promptAnswers(
  partial: Partial<ScaffoldAnswers>,
): Promise<ScaffoldAnswers> {
  const rl = createInterface({ input, output });

  try {
    let name = partial.name;
    if (!name) {
      name = (await rl.question('Name (kebab-case): ')).trim();
    }

    let mode = partial.mode;
    if (!mode) {
      const interactive = (
        await rl.question('Needs client interactivity? [y/N]: ')
      )
        .trim()
        .toLowerCase();
      mode = interactive === 'y' || interactive === 'yes' ? 'island' : 'page';
    }

    let withStyles = partial.withStyles ?? false;
    if (mode === 'island' && partial.withStyles === undefined) {
      const styles = (
        await rl.question(
          'Needs interaction-specific styles beyond the shell? [y/N]: ',
        )
      )
        .trim()
        .toLowerCase();
      withStyles = styles === 'y' || styles === 'yes';
    }

    return { name: name ?? '', mode, withStyles };
  } finally {
    rl.close();
  }
}

/**
 * CLI entry: parse flags, prompt if needed, write files, print next steps.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const parsed = parseScaffoldArgs(argv);

  if (parsed.help) {
    printHelp();
    return;
  }

  const answers =
    parsed.name && parsed.mode
      ? {
          name: parsed.name,
          mode: parsed.mode,
          withStyles: parsed.withStyles ?? false,
        }
      : await promptAnswers(parsed);

  const plan = resolveScaffoldPlan(answers);
  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const written = await applyScaffoldPlan(rootDir, plan);

  output.write(`Scaffolded ${plan.mode} "${plan.name}":\n`);
  for (const path of written) {
    output.write(`  ${path.replace(`${rootDir}/`, '')}\n`);
  }

  if (plan.mode === 'page') {
    output.write(`
Next steps:
  1. Add "${plan.name}" to WebPageName and the pages map in src/web/ssr/entry-server.tsx
  2. Add a WebController method that calls webViewService.render('${plan.name}', props)
  3. Style with shell classes only — see docs/how-to-web-ui.md
`);
  } else {
    output.write(`
Next steps:
  Render on a page:
    import ${plan.pascalName} from '../islands/${plan.name}.js';
    import { Island } from '../island-runtime/island.js';
    <Island name="${plan.name}" component={${plan.pascalName}} props={{}} />

  CSS is inlined as a sibling <style> at SSR when cssModulePath is set.
  Do not re-import the shell sheet. See docs/how-to-web-ui.md
`);
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}

/**
 * Scaffolds an SSR page stub or interactive island under `src/web/`.
 *
 * Shared by humans (`pnpm scaffold:web-ui`) and the `create-web-ui` agent skill.
 * Prefer this script over hand-wiring so island folders stay conventional.
 * With `islands.registration=filesystem`, island mode runs sync; with
 * `manifest`, it warns that authors must add a map entry (no sync).
 *
 * Usage:
 *   pnpm scaffold:web-ui --name my-widget --mode island --with-styles
 *   pnpm scaffold:web-ui --name about --mode page
 *   pnpm scaffold:web-ui   # interactive
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { stdin as input, stdout as output } from 'node:process';
import {
  getIslandsRegistration,
  loadAndApplyArchipielagoConfig,
  manualIslandManifestWarning,
} from '../src/archipielago/core/config.js';
import { getArchipielagoPaths } from '../src/archipielago/core/paths.js';
import { syncIslandManifest } from './sync-island-manifest.js';

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
  pageIndexPath: string;
  pageStoriesPath: string;
  pagePropsPath: string;
  islandComponentPath: string;
  islandIndexPath: string;
  islandStoriesPath: string;
  islandModulePath: string | undefined;
  cssModulePath: string | undefined;
}

/** Files written plus author-facing notes (e.g. manual manifest entry). */
export interface ScaffoldResult {
  written: string[];
  notes: string[];
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
  const pageFolder = `${name}-page`;

  return {
    name,
    mode: answers.mode,
    withStyles,
    pascalName,
    pageComponentPath: `src/web/ui/pages/${pageFolder}/${pageFolder}.tsx`,
    pageIndexPath: `src/web/ui/pages/${pageFolder}/index.ts`,
    pageStoriesPath: `src/web/ui/pages/${pageFolder}/${pageFolder}.stories.tsx`,
    pagePropsPath: `src/web/protocol/page-props/${pageFolder}.ssr-props.ts`,
    islandComponentPath: `src/web/ui/islands/${name}/${name}.tsx`,
    islandIndexPath: `src/web/ui/islands/${name}/index.ts`,
    islandStoriesPath: `src/web/ui/islands/${name}/${name}.stories.tsx`,
    islandModulePath: withStyles
      ? `src/web/ui/islands/${name}/${name}.module.scss`
      : undefined,
    cssModulePath: withStyles
      ? `/src/web/ui/islands/${name}/${name}.module.scss`
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
  const propsName = `${plan.pascalName}PageSsrProps`;
  const componentName = `${plan.pascalName}Page`;

  const props = `/**
 * SSR embed props for the ${plan.name} page component (\`ui/pages/${plan.name}-page/\`).
 *
 * Built by Nest (\`WebController\`), passed through \`WebViewService.render\`,
 * consumed by the Vite SSR page. JSON-serializable only. Not colocated with
 * the page on purpose — see ADR-0023 / how-to-web-ui (SSR page props quirk).
 */
export interface ${propsName} {
  /** Replace with real request-derived fields. */
  title: string;
}
`;

  const component = `import type { ReactElement } from 'react';
import type { ${propsName} } from '@protocol/page-props/${plan.name}-page.ssr-props';

/**
 * Renders the ${plan.name} page body.
 *
 * Server-only: this component is not part of the client bundle.
 * Style with shell classes from \`ui/styles/shell.scss\` only — do not import a CSS module.
 *
 * Wire into \`protocol/page-props/page-props.ts\` (\`SsrPagePropsMap\`),
 * \`ui/runtime/ssr/entry-server.tsx\`, and a \`WebController\` method next
 * (controller imports this SSR props type only — never the page \`.tsx\`).
 *
 * @param {${propsName}} props - SSR embed props from the controller.
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
 * Builds a minimal CSF3 Storybook stub for a scaffolded page.
 *
 * @param {ScaffoldPlan} plan - Validated plan.
 * @returns {string} Story file contents.
 */
function pageStoriesSource(plan: ScaffoldPlan): string {
  const componentName = `${plan.pascalName}Page`;
  return `import type { Meta, StoryObj } from '@storybook/react-vite';
import { ${componentName} } from './${plan.name}-page';

const meta = {
  title: 'Pages/${componentName}',
  component: ${componentName},
  args: {
    title: '${plan.pascalName}',
  },
} satisfies Meta<typeof ${componentName}>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
`;
}

/**
 * Builds a minimal CSF3 Storybook stub for a scaffolded island.
 *
 * @param {ScaffoldPlan} plan - Validated plan.
 * @returns {string} Story file contents.
 */
function islandStoriesSource(plan: ScaffoldPlan): string {
  return `import type { Meta, StoryObj } from '@storybook/react-vite';
import ${plan.pascalName} from './${plan.name}';

const meta = {
  title: 'Islands/${plan.pascalName}',
  component: ${plan.pascalName},
} satisfies Meta<typeof ${plan.pascalName}>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
`;
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
 * Scaffold runs \`pnpm islands:sync\` so the host catalog picks this folder up.
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

@import '@ui/styles/tokens';

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
 * Writes scaffold files under `rootDir`; syncs or warns per registration mode.
 *
 * Callers that care about host config should run
 * {@link loadAndApplyArchipielagoConfig} first (CLI does). Tests may set mode
 * via `applyArchipielagoUserConfig` instead.
 *
 * @param {string} rootDir - Repository root.
 * @param {ScaffoldPlan} plan - Validated plan.
 * @returns {Promise<ScaffoldResult>} Paths written and author notes.
 */
export async function applyScaffoldPlan(
  rootDir: string,
  plan: ScaffoldPlan,
): Promise<ScaffoldResult> {
  const written: string[] = [];
  const notes: string[] = [];

  if (plan.mode === 'page') {
    const { props, component } = pageSources(plan);
    const propsAbs = join(rootDir, plan.pagePropsPath);
    const componentAbs = join(rootDir, plan.pageComponentPath);
    const indexAbs = join(rootDir, plan.pageIndexPath);
    const storiesAbs = join(rootDir, plan.pageStoriesPath);

    if (existsSync(propsAbs) || existsSync(componentAbs)) {
      throw new Error(
        `Page files already exist for "${plan.name}" (protocol page-props or ui/pages)`,
      );
    }

    const pageIndex = `export { ${plan.pascalName}Page } from './${plan.name}-page';\n`;

    await mkdir(dirname(propsAbs), { recursive: true });
    await mkdir(dirname(componentAbs), { recursive: true });
    await writeFile(propsAbs, props, 'utf8');
    await writeFile(componentAbs, component, 'utf8');
    await writeFile(indexAbs, pageIndex, 'utf8');
    await writeFile(storiesAbs, pageStoriesSource(plan), 'utf8');
    written.push(propsAbs, componentAbs, indexAbs, storiesAbs);
    return { written, notes };
  }

  const { component, moduleCss } = islandSources(plan);
  const componentAbs = join(rootDir, plan.islandComponentPath);
  const indexAbs = join(rootDir, plan.islandIndexPath);
  const storiesAbs = join(rootDir, plan.islandStoriesPath);
  if (existsSync(componentAbs)) {
    throw new Error(`Island file already exists: ${plan.islandComponentPath}`);
  }
  if (plan.islandModulePath) {
    const moduleAbs = join(rootDir, plan.islandModulePath);
    if (existsSync(moduleAbs)) {
      throw new Error(`CSS module already exists: ${plan.islandModulePath}`);
    }
  }

  const islandIndex = `export { default } from './${plan.name}';\n`;

  await mkdir(dirname(componentAbs), { recursive: true });
  await writeFile(componentAbs, component, 'utf8');
  await writeFile(indexAbs, islandIndex, 'utf8');
  await writeFile(storiesAbs, islandStoriesSource(plan), 'utf8');
  written.push(componentAbs, indexAbs, storiesAbs);

  if (moduleCss && plan.islandModulePath) {
    const moduleAbs = join(rootDir, plan.islandModulePath);
    await writeFile(moduleAbs, moduleCss, 'utf8');
    written.push(moduleAbs);
  }

  const hasCssModule = plan.islandModulePath !== undefined;
  if (getIslandsRegistration() === 'manifest') {
    // Host owns the table — do not call sync (would refuse / overwrite).
    notes.push(
      manualIslandManifestWarning(
        plan.name,
        hasCssModule,
        getArchipielagoPaths().islandsGeneratedRel,
      ),
    );
  } else {
    // filesystem mode: regenerate the islands map from conventional folders.
    const { path: islandsManifestPath } = await syncIslandManifest(rootDir);
    written.push(islandsManifestPath);
  }

  return { written, notes };
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

--with-styles is allowed only with --mode island (adds *.module.scss).
Island mode runs islands:sync when archipielago.config registration is
filesystem; otherwise it warns about adding a manual manifest entry.
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
  await loadAndApplyArchipielagoConfig(rootDir);
  const { written, notes } = await applyScaffoldPlan(rootDir, plan);

  output.write(`Scaffolded ${plan.mode} "${plan.name}":\n`);
  for (const path of written) {
    output.write(`  ${path.replace(`${rootDir}/`, '')}\n`);
  }
  for (const note of notes) {
    output.write(`\n${note}\n`);
  }

  if (plan.mode === 'page') {
    output.write(`
Next steps:
  1. Add "${plan.name}" to SsrPagePropsMap in src/web/protocol/page-props/page-props.ts
  2. Map the page in src/web/ui/runtime/ssr/entry-server.tsx
  3. Add a WebController method that imports SSR props from protocol/page-props/ only
     and calls webViewService.render('${plan.name}', props)
  4. Style with shell classes only — see docs/how-to-web-ui.md (SSR page props quirk)
  5. Browse the stub story with pnpm storybook (workshop, not QA)
`);
  } else if (getIslandsRegistration() === 'manifest') {
    output.write(`
Next steps:
  1. Add the manifest entry above (registration=manifest; sync will not run).
  2. Render on a page (leave the page folder via @ui aliases — ADR-0027):
    import ${plan.pascalName} from '@ui/islands/${plan.name}';
    import { Island } from '@archipielago/react/runtime/island/island';
    <Island name="${plan.name}" component={${plan.pascalName}} props={{}} />

  Hydrate loaders pick up the conventional folder via glob. Browse with pnpm storybook.
  See docs/how-to-web-ui.md
`);
  } else {
    output.write(`
Next steps:
  Render on a page (leave the page folder via @ui aliases — ADR-0027):
    import ${plan.pascalName} from '@ui/islands/${plan.name}';
    import { Island } from '@archipielago/react/runtime/island/island';
    <Island name="${plan.name}" component={${plan.pascalName}} props={{}} />

  Scaffold ran islands:sync (${getArchipielagoPaths().islandsGeneratedRel}).
  Hydrate loaders pick up the new folder via glob — no registry edit.
  Browse with pnpm storybook. See docs/how-to-web-ui.md
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

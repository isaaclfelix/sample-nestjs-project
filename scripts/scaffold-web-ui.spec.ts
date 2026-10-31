import { mkdtemp, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyArchipielagoUserConfig,
  resetArchipielagoConfig,
} from '../src/archipielago/core/config.js';
import {
  applyScaffoldPlan,
  kebabToPascal,
  parseScaffoldArgs,
  resolveScaffoldPlan,
} from './scaffold-web-ui.js';

const tempDirs: string[] = [];

afterEach(async () => {
  resetArchipielagoConfig();
  // Best-effort cleanup; tests do not require the dirs to survive.
  const { rm } = await import('node:fs/promises');
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe('kebabToPascal', () => {
  it('converts kebab-case to PascalCase', () => {
    expect(kebabToPascal('my-widget')).toBe('MyWidget');
    expect(kebabToPascal('counter')).toBe('Counter');
  });
});

describe('resolveScaffoldPlan', () => {
  it('rejects page mode with styles', () => {
    expect(() =>
      resolveScaffoldPlan({ name: 'about', mode: 'page', withStyles: true }),
    ).toThrow(/Cannot use --with-styles with --mode page/);
  });

  it('rejects invalid names', () => {
    expect(() =>
      resolveScaffoldPlan({
        name: 'MyWidget',
        mode: 'page',
        withStyles: false,
      }),
    ).toThrow(/kebab-case/);
  });

  it('plans an island with a CSS module path', () => {
    const plan = resolveScaffoldPlan({
      name: 'my-widget',
      mode: 'island',
      withStyles: true,
    });
    expect(plan.islandComponentPath).toBe(
      'src/web/ui/islands/my-widget/my-widget.tsx',
    );
    expect(plan.islandIndexPath).toBe('src/web/ui/islands/my-widget/index.ts');
    expect(plan.islandStoriesPath).toBe(
      'src/web/ui/islands/my-widget/my-widget.stories.tsx',
    );
    expect(plan.islandModulePath).toBe(
      'src/web/ui/islands/my-widget/my-widget.module.scss',
    );
    expect(plan.cssModulePath).toBe(
      '/src/web/ui/islands/my-widget/my-widget.module.scss',
    );
    expect(plan.withStyles).toBe(true);
  });

  it('plans an island without a CSS module', () => {
    const plan = resolveScaffoldPlan({
      name: 'toggle',
      mode: 'island',
      withStyles: false,
    });
    expect(plan.islandModulePath).toBeUndefined();
    expect(plan.cssModulePath).toBeUndefined();
  });

  it('plans a page stub', () => {
    const plan = resolveScaffoldPlan({
      name: 'about',
      mode: 'page',
      withStyles: false,
    });
    expect(plan.pageComponentPath).toBe(
      'src/web/ui/pages/about-page/about-page.tsx',
    );
    expect(plan.pageIndexPath).toBe('src/web/ui/pages/about-page/index.ts');
    expect(plan.pageStoriesPath).toBe(
      'src/web/ui/pages/about-page/about-page.stories.tsx',
    );
    expect(plan.pagePropsPath).toBe(
      'src/web/protocol/page-props/about-page.ssr-props.ts',
    );
  });
});

describe('parseScaffoldArgs', () => {
  it('parses name, mode, and with-styles', () => {
    expect(
      parseScaffoldArgs([
        '--name',
        'my-widget',
        '--mode',
        'island',
        '--with-styles',
      ]),
    ).toEqual({
      name: 'my-widget',
      mode: 'island',
      withStyles: true,
    });
  });

  it('rejects unknown flags', () => {
    expect(() => parseScaffoldArgs(['--dry-run'])).toThrow(/Unknown argument/);
  });
});

describe('applyScaffoldPlan', () => {
  it('writes page files under a temp root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'scaffold-web-ui-'));
    tempDirs.push(root);

    const plan = resolveScaffoldPlan({
      name: 'about',
      mode: 'page',
      withStyles: false,
    });
    const { written } = await applyScaffoldPlan(root, plan);
    expect(written).toHaveLength(4);
    const props = await readFile(join(root, plan.pagePropsPath), 'utf8');
    expect(props).toContain('AboutPageSsrProps');
    const component = await readFile(
      join(root, plan.pageComponentPath),
      'utf8',
    );
    expect(component).toContain(
      "from '@protocol/page-props/about-page.ssr-props'",
    );
    const index = await readFile(join(root, plan.pageIndexPath), 'utf8');
    expect(index).toContain("export { AboutPage } from './about-page'");
    const stories = await readFile(join(root, plan.pageStoriesPath), 'utf8');
    expect(stories).toContain("title: 'Pages/AboutPage'");
  });

  it('writes island files and syncs the protocol islands manifest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'scaffold-web-ui-'));
    tempDirs.push(root);
    await mkdir(join(root, 'src/web/ui/islands'), { recursive: true });
    await mkdir(join(root, 'src/web/protocol'), { recursive: true });

    const plan = resolveScaffoldPlan({
      name: 'toggle',
      mode: 'island',
      withStyles: true,
    });
    const { written, notes } = await applyScaffoldPlan(root, plan);

    const component = await readFile(
      join(root, plan.islandComponentPath),
      'utf8',
    );
    expect(component).toContain('import styles from');
    const index = await readFile(join(root, plan.islandIndexPath), 'utf8');
    expect(index).toContain("export { default } from './toggle'");
    const stories = await readFile(join(root, plan.islandStoriesPath), 'utf8');
    expect(stories).toContain("title: 'Islands/Toggle'");
    const moduleCss = await readFile(
      join(root, plan.islandModulePath!),
      'utf8',
    );
    expect(moduleCss).toContain('.root');
    expect(moduleCss).toContain('@ui/styles/tokens');
    expect(
      written.some((path) => path.endsWith('protocol/islands.generated.ts')),
    ).toBe(true);
    expect(notes).toEqual([]);
    const manifest = await readFile(
      join(root, 'src/web/protocol/islands.generated.ts'),
      'utf8',
    );
    expect(manifest).toContain("'toggle': { hasCssModule: true }");
  });

  it('warns for a manifest entry and skips sync in manual mode', async () => {
    applyArchipielagoUserConfig({
      islands: { registration: 'manual' },
    });
    const root = await mkdtemp(join(tmpdir(), 'scaffold-web-ui-manual-'));
    tempDirs.push(root);
    await mkdir(join(root, 'src/web/ui/islands'), { recursive: true });

    const plan = resolveScaffoldPlan({
      name: 'toggle',
      mode: 'island',
      withStyles: false,
    });
    const { written, notes } = await applyScaffoldPlan(root, plan);

    expect(
      written.some((path) => path.endsWith('protocol/islands.generated.ts')),
    ).toBe(false);
    expect(notes[0]).toContain('islands.registration=manual');
    expect(notes[0]).toContain("'toggle': { hasCssModule: false }");
  });
});

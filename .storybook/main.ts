import type { StorybookConfig } from '@storybook/react-vite';
import doiuse from 'doiuse';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sortMediaQueries from 'postcss-sort-media-queries';
import { mergeConfig } from 'vite';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Storybook workshop for product UI under `src/web/ui/`.
 *
 * Vite builder only — do not load product island CSS suppress / shell-budget
 * plugins; preview needs CSS modules to inject normally. Sass PostCSS matches
 * the app Vite pipeline (sort + doiuse warn). Path aliases match ADR-0027.
 */
const config: StorybookConfig = {
  stories: [
    '../src/web/ui/{pages,islands,server-components,shared-components}/**/*.stories.@(ts|tsx)',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@ui': resolve(repoRoot, 'src/web/ui'),
          '@protocol': resolve(repoRoot, 'src/web/protocol'),
          '@api': resolve(repoRoot, 'src/api'),
          '@archipielago': resolve(repoRoot, 'src/archipielago'),
        },
      },
      css: {
        postcss: {
          plugins: [
            sortMediaQueries({ sort: 'mobile-first' }),
            doiuse({
              browsers: ['baseline widely available'],
              onFeatureUsage(usageInfo: { message: string }): void {
                console.warn(`[doiuse] ${usageInfo.message}`);
              },
            }),
          ],
        },
      },
    });
  },
};

export default config;

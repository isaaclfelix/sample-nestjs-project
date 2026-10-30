import type { StorybookConfig } from '@storybook/react-vite';
import doiuse from 'doiuse';
import sortMediaQueries from 'postcss-sort-media-queries';
import { mergeConfig } from 'vite';

/**
 * Storybook workshop for product UI under `src/web/ui/`.
 *
 * Vite builder only — do not load product island CSS suppress / shell-budget
 * plugins; preview needs CSS modules to inject normally. Sass PostCSS matches
 * the app Vite pipeline (sort + doiuse warn).
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

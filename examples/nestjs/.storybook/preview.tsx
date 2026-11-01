import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect, type ReactElement } from 'react';
import { CSRF_META_NAME } from '../src/api/auth/session.constants';
import '../src/web/ui/styles/shell.scss';
import '../src/web/ui/styles/forms.scss';

/**
 * Ensures mutating islands see a CSRF meta tag like Nest SSR pages do.
 *
 * @returns {() => void} Cleanup that removes the meta node.
 */
function ensureCsrfMeta(): () => void {
  const existing = document.querySelector(`meta[name="${CSRF_META_NAME}"]`);
  if (existing) {
    return () => undefined;
  }

  const meta = document.createElement('meta');
  meta.name = CSRF_META_NAME;
  meta.content = 'storybook-csrf';
  document.head.appendChild(meta);
  return () => {
    meta.remove();
  };
}

/**
 * Stubs `fetch` so auth islands do not call a real API from the workshop.
 *
 * Default response is 401 JSON so login/register can show form errors without
 * Nest. Stories may override by assigning `window.fetch` in their own setup.
 *
 * @returns {() => void} Cleanup that restores the previous `fetch`.
 */
function stubFetch(): () => void {
  const previous = window.fetch.bind(window);
  window.fetch = async (): Promise<Response> =>
    new Response(JSON.stringify({ message: 'storybook stub' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  return () => {
    window.fetch = previous;
  };
}

/**
 * Workshop decorator: CSRF meta + safe `fetch` stub for the canvas lifetime.
 *
 * @param {() => ReactElement} Story - Storybook story render function.
 * @returns {ReactElement} Story wrapped with workshop side effects.
 */
const workshopDecorator: Decorator = (Story): ReactElement => {
  useEffect(() => {
    const removeMeta = ensureCsrfMeta();
    const restoreFetch = stubFetch();
    return () => {
      restoreFetch();
      removeMeta();
    };
  }, []);

  return <Story />;
};

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  decorators: [workshopDecorator],
};

export default preview;

import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig, loadEnv} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {vitePlugin as remix} from '@remix-run/dev';
import tsconfigPaths from 'vite-tsconfig-paths';
import {
  createHydrogenRemixLoadContext,
  hydrogenEnvFromProcess,
} from './hydrogen-load-context';

const require = createRequire(import.meta.url);
const {setRemixDevLoadContext} =
  require('@remix-run/dev/dist/vite/plugin.js') as typeof import('@remix-run/dev/dist/vite/plugin');

const root = path.dirname(fileURLToPath(import.meta.url));
Object.assign(
  process.env,
  loadEnv(process.env.NODE_ENV ?? 'development', root, ''),
);

setRemixDevLoadContext(async (request: Request) => {
  const env = hydrogenEnvFromProcess();
  const waitUntil = (promise: Promise<unknown>) => {
    void promise.catch(() => {});
  };
  return createHydrogenRemixLoadContext(request, env, waitUntil);
});

export default defineConfig({
  plugins: [
    hydrogen(),
    oxygen(),
    remix({
      presets: [hydrogen.preset()],
      ignoredRouteFiles: ['**/.*'],
    }),
    tsconfigPaths(),
  ],
});

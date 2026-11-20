// Writes apps/api/openapi.json from the route schemas, or with --check fails when the committed
// file differs from what the routes generate (CI, lint stage). Run through tsx, which loads the
// TypeScript sources: `npm run openapi:generate` / `npm run openapi:check`.
import console from 'node:console';
import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import { createApp } from '../src/app.ts';
import {
  assertRouteInventory,
  buildOpenApiDocument,
  serializeOpenApiDocument,
} from '../src/openapi.ts';
import { createWorkersPlatform } from '../src/platform.ts';

const target = fileURLToPath(new URL('../openapi.json', import.meta.url));
const check = process.argv.includes('--check');

async function readCurrent() {
  try {
    return await readFile(target, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

const app = createApp(createWorkersPlatform);
assertRouteInventory(app);
const options = (await prettier.resolveConfig(target)) ?? {};
const generated = await prettier.format(serializeOpenApiDocument(buildOpenApiDocument(app)), {
  ...options,
  filepath: target,
});

if (!check) {
  await writeFile(target, generated);
  console.log('Wrote apps/api/openapi.json');
} else if ((await readCurrent()) !== generated) {
  console.error(
    'apps/api/openapi.json does not match the routes. Run `npm run openapi:generate` and commit the result.',
  );
  process.exitCode = 1;
} else {
  console.log('apps/api/openapi.json matches the routes.');
}

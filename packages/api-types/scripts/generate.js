// Writes src/schema.ts from apps/api/openapi.json with openapi-typescript, or with --check fails
// when the committed file differs from what openapi.json generates (CI, lint stage). The file is
// committed so that type checking and tests never need a build first.
import console from 'node:console';
import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';
import * as prettier from 'prettier';

const source = fileURLToPath(new URL('../../../apps/api/openapi.json', import.meta.url));
const target = fileURLToPath(new URL('../src/schema.ts', import.meta.url));
const check = process.argv.includes('--check');

const HEADER = `// Generated from apps/api/openapi.json by \`npm run openapi:generate\`. Do not edit by hand.\n\n`;

async function readCurrent() {
  try {
    return await readFile(target, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

const document = JSON.parse(await readFile(source, 'utf8'));
const ast = await openapiTS(document, { alphabetize: true, silent: true });
const options = (await prettier.resolveConfig(target)) ?? {};
const generated = await prettier.format(HEADER + astToString(ast), {
  ...options,
  filepath: target,
});

if (!check) {
  await writeFile(target, generated);
  console.log('Wrote packages/api-types/src/schema.ts');
} else if ((await readCurrent()) !== generated) {
  console.error(
    'packages/api-types/src/schema.ts does not match apps/api/openapi.json. Run `npm run openapi:generate` and commit the result.',
  );
  process.exitCode = 1;
} else {
  console.log('packages/api-types/src/schema.ts matches apps/api/openapi.json.');
}

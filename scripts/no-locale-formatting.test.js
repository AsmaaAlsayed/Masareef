import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint, Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

/**
 * FR-022 and the architecture ("Not chosen as libraries"): shipped code in packages/core and
 * apps/web/src never formats with Intl or toLocale*, whose output varies by engine and uses
 * Arabic-Indic digits for Arabic. This checks that the lint configuration applies that rule to
 * those files and that the rule rejects each API, so removing or narrowing it fails here.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULE = 'no-restricted-properties';

const PLANTED = [
  "new Intl.NumberFormat('ar-EG').format(1234.5);",
  "new Intl.DateTimeFormat('ar-EG').format(new Date(0));",
  "(1234.5).toLocaleString('ar-EG');",
  "new Date(0).toLocaleDateString('ar-EG');",
  "new Date(0).toLocaleTimeString('ar-EG');",
  "new globalThis.Intl.NumberFormat('ar').format(1);",
  "new window.Intl.DateTimeFormat('ar').format(new Date(0));",
];

const eslint = new ESLint({ cwd: ROOT });

/**
 * The first call loads the whole lint configuration (typescript-eslint, @eslint/css). That takes
 * about 2 seconds alone but can pass Vitest's 5-second default while every other test file runs in
 * parallel, so this test is given longer; it is not slow because of anything it asserts.
 */
const ESLINT_LOAD_TIMEOUT = 30_000;

async function ruleFor(file) {
  const config = await eslint.calculateConfigForFile(path.join(ROOT, file));
  return config.rules?.[RULE];
}

function errorsIn(code, rule) {
  const linter = new Linter();
  return linter.verify(code, [{ rules: { [RULE]: rule } }]);
}

describe('no locale-dependent formatting in shipped code (FR-022)', () => {
  it(
    'every_planted_use_is_reported_in_core_and_web_sources',
    async () => {
      for (const file of [
        'packages/core/src/format.ts',
        'apps/web/src/formatting.tsx',
        'apps/web/src/bootstrap.ts',
      ]) {
        const rule = await ruleFor(file);
        expect(rule, file).toBeDefined();
        for (const code of PLANTED) {
          const messages = errorsIn(code, rule);
          expect(
            messages.map((message) => message.ruleId),
            `${file}: ${code}`,
          ).toEqual([RULE]);
          expect(messages[0]?.severity).toBe(2);
        }
      }
    },
    ESLINT_LOAD_TIMEOUT,
  );

  it('the_formatters_own_code_passes', async () => {
    const rule = await ruleFor('packages/core/src/format.ts');
    expect(errorsIn("String(16) + ' ' + 'Nov';", rule)).toEqual([]);
  });

  it('tests_are_not_restricted', async () => {
    for (const file of ['packages/core/src/format.test.ts', 'apps/web/src/formatting.test.tsx']) {
      const rule = await ruleFor(file);
      expect(rule === undefined || rule[0] === 0, file).toBe(true);
    }
  });
});

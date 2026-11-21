// Fails when an interface text is missing or empty in either language, uses Arabic-Indic digits,
// or names different placeholders in the two languages (NFR-009, FR-022). Runs in the pipeline's
// lint stage through tsx, which loads the TypeScript sources: `npm run i18n:check`.
import console from 'node:console';
import process from 'node:process';
import { checkTranslations, TRANSLATIONS } from '../src/i18n/index.ts';

const problems = checkTranslations(TRANSLATIONS);

if (problems.length === 0) {
  console.log('Translation keys: English and Arabic are complete.');
} else {
  for (const { language, key, problem } of problems) {
    console.error(`${language}: ${key === '' ? '(no keys)' : key}: ${problem}`);
  }
  console.error(`Translation keys: ${problems.length} problem(s).`);
  process.exitCode = 1;
}

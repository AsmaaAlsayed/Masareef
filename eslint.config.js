import css from '@eslint/css';
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

const LETTER = '/\\p{L}/u';
const TRANSLATE =
  'User-facing text comes from the translations in packages/core: use t() (NFR-009).';
const MIRROR = 'Use the logical property so the layout mirrors in Arabic (architecture C1).';

/** Attributes whose text a user sees or hears. */
const USER_VISIBLE_ATTRIBUTE =
  'JSXAttribute[name.name=/^(aria-label|aria-description|aria-placeholder|aria-roledescription|aria-valuetext|title|placeholder|alt|label)$/]';

/** React inline styles use camelCase names; these are the physical ones. */
const PHYSICAL_STYLE_PROPERTY =
  '/^(top|bottom|left|right|width|height|minWidth|maxWidth|minHeight|maxHeight|(margin|padding|scrollMargin|scrollPadding)(Top|Bottom|Left|Right)|border(Top|Bottom|Left|Right)(Color|Style|Width)?|border(Top|Bottom)(Left|Right)Radius|overflowX|overflowY)$/';

/** The web app's components: no literal user-facing text, no physical inline-style properties. */
const webRestrictions = [
  { selector: `JSXText[value=${LETTER}]`, message: TRANSLATE },
  { selector: `JSXExpressionContainer > Literal[value=${LETTER}]`, message: TRANSLATE },
  {
    selector: `JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=${LETTER}]`,
    message: TRANSLATE,
  },
  { selector: `${USER_VISIBLE_ATTRIBUTE} > Literal[value=${LETTER}]`, message: TRANSLATE },
  {
    selector: `${USER_VISIBLE_ATTRIBUTE} > JSXExpressionContainer > :matches(Literal[value=${LETTER}], TemplateLiteral)`,
    message: TRANSLATE,
  },
  {
    selector: `JSXAttribute[name.name='style'] Property > Identifier.key[name=${PHYSICAL_STYLE_PROPERTY}]`,
    message: MIRROR,
  },
  {
    selector:
      "JSXAttribute[name.name='style'] Property[key.name=/^(textAlign|float|clear)$/] > Literal[value=/^(left|right)$/]",
    message: `${MIRROR} Use 'start' or 'end'.`,
  },
  {
    selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
    message: 'Render text, never HTML (architecture, "Input and output").',
  },
];

export default defineConfig(
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/build/',
    '**/coverage/',
    '**/.wrangler/',
    'apps/web/e2e/output/',
  ]),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Plain JavaScript configuration files are not part of a TypeScript project.
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // Tests are exempt: they assert on the texts.
    files: ['apps/web/src/**/*.tsx'],
    ignores: ['**/*.test.tsx'],
    rules: { 'no-restricted-syntax': ['error', ...webRestrictions] },
  },
  {
    // Logical properties only (margin-inline-start, not margin-left; text-align: start), so every
    // style works right-to-left (architecture C1, NFR-009).
    files: ['**/*.css'],
    language: 'css/css',
    plugins: { css },
    extends: ['css/recommended'],
    rules: { 'css/prefer-logical-properties': 'error' },
  },
);

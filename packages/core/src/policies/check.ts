import { parseCalendarDate } from '../calendar.js';
import { LANGUAGES } from '../language.js';
import type { Language } from '../language.js';
import { POLICY_KINDS } from './types.js';
import type {
  PolicyBlock,
  PolicyDocument,
  PolicyKind,
  PolicyLibrary,
  PolicyRun,
  PolicyText,
} from './types.js';

export type PolicyProblemKind =
  | 'version_invalid'
  | 'effective_date_invalid'
  | 'draft'
  | 'served_version_differs'
  | 'document_missing'
  | 'document_empty'
  | 'document_outdated'
  | 'non_western_digit'
  | 'contact_placeholder'
  | 'contact_invalid';

export interface PolicyProblem {
  /** The document concerned; absent for the contact address, which both documents share. */
  readonly kind?: PolicyKind;
  /** The language version concerned, for problems with one language's text. */
  readonly language?: Language;
  readonly problem: PolicyProblemKind;
}

/** The versions `GET /api/v1/config` serves, by document. */
export type ServedPolicyVersions = Readonly<Record<PolicyKind, string>>;

/** A whole number above 0 in Western digits (see versions.ts). */
const VERSION = /^[1-9][0-9]*$/;
/** Arabic-Indic and Extended Arabic-Indic digits: never in text the app shows (FR-022). */
const NON_WESTERN_DIGIT = /[٠-٩۰-۹]/;
/** Enough to refuse a placeholder or a typing slip; the address is published by hand (P-12). */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function runsOf(text: PolicyText): readonly PolicyRun[] {
  return typeof text === 'string' ? [text] : text;
}

function runText(run: PolicyRun): string {
  if (typeof run === 'string') return run;
  return 'name' in run ? run.name : run.text;
}

function blockTexts(block: PolicyBlock): readonly PolicyText[] {
  return block.kind === 'list' ? block.items : [block.text];
}

/**
 * Every piece of text of a document, in reading order: each section heading, then each run of its
 * blocks (a proper name and a link text are runs of their own). Used to check that a document is
 * not empty, to look for digits, and by the test harness's pseudo-locale.
 */
export function policyTexts(document: PolicyDocument): string[] {
  return document.sections.flatMap((section) => [
    section.heading,
    ...section.blocks.flatMap((block) =>
      blockTexts(block).flatMap((text) => runsOf(text).map(runText)),
    ),
  ]);
}

const isBlank = (text: string) => text.trim() === '';

function isEmpty(document: PolicyDocument): boolean {
  if (document.sections.length === 0) return true;
  return document.sections.some(
    (section) =>
      isBlank(section.heading) ||
      section.blocks.length === 0 ||
      section.blocks.some((block) => {
        const texts = blockTexts(block);
        return (
          texts.length === 0 ||
          texts.some(
            (text) =>
              isBlank(runsOf(text).map(runText).join('')) ||
              runsOf(text).some((run) => typeof run !== 'string' && isBlank(runText(run))),
          )
        );
      }),
  );
}

/**
 * The document in exactly this language, or `undefined` when that language's text is missing,
 * empty or written for another version. Never the other language's text (FR-039 criterion 5).
 */
export function policyDocument(
  library: PolicyLibrary,
  kind: PolicyKind,
  language: Language,
): PolicyDocument | undefined {
  const document = library.documents[kind][language];
  if (document === undefined || isEmpty(document)) return undefined;
  return document.version === library.versions[kind].version ? document : undefined;
}

function documentProblems(
  library: PolicyLibrary,
  kind: PolicyKind,
  language: Language,
): PolicyProblem[] {
  const document = library.documents[kind][language];
  const problem = (kind_: PolicyProblemKind): PolicyProblem => ({
    kind,
    language,
    problem: kind_,
  });
  if (document === undefined) return [problem('document_missing')];
  if (isEmpty(document)) return [problem('document_empty')];
  const problems: PolicyProblem[] = [];
  if (document.version !== library.versions[kind].version)
    problems.push(problem('document_outdated'));
  if (policyTexts(document).some((text) => NON_WESTERN_DIGIT.test(text))) {
    problems.push(problem('non_western_digit'));
  }
  return problems;
}

/**
 * Everything that blocks a release of the policy documents (FR-039 criteria 3 to 5): a missing,
 * empty or out-of-date language version, a version that is not a whole number, an effective date
 * that is not a calendar date, a version that `GET /config` does not serve, a draft, Arabic-Indic
 * digits, or a contact address that is still a placeholder. An empty list means the release may go
 * ahead. Problems are listed by document, then the contact address.
 */
export function checkPolicies(
  library: PolicyLibrary,
  served: ServedPolicyVersions,
): PolicyProblem[] {
  const problems: PolicyProblem[] = [];
  for (const kind of POLICY_KINDS) {
    const { version, effectiveDate, draft } = library.versions[kind];
    if (!VERSION.test(version)) problems.push({ kind, problem: 'version_invalid' });
    if (parseCalendarDate(effectiveDate) === undefined) {
      problems.push({ kind, problem: 'effective_date_invalid' });
    }
    if (draft) problems.push({ kind, problem: 'draft' });
    if (served[kind] !== version) problems.push({ kind, problem: 'served_version_differs' });
    for (const language of LANGUAGES) problems.push(...documentProblems(library, kind, language));
  }
  if (library.contact.kind === 'placeholder') problems.push({ problem: 'contact_placeholder' });
  else if (!EMAIL.test(library.contact.address)) problems.push({ problem: 'contact_invalid' });
  return problems;
}

const DOCUMENT_NAMES: Readonly<Record<PolicyKind, string>> = {
  privacy: 'privacy policy',
  terms: 'terms of use',
};

const LANGUAGE_NAMES: Readonly<Record<Language, string>> = { en: 'English', ar: 'Arabic' };

/** One line of the release check's report, for the person running the release. */
export function describePolicyProblem({ kind, language, problem }: PolicyProblem): string {
  const version = `the ${language === undefined ? '' : LANGUAGE_NAMES[language]} version`;
  const messages: Record<PolicyProblemKind, string> = {
    version_invalid: 'the version is empty or not a whole number above 0',
    effective_date_invalid: 'the effective date is not a calendar date written YYYY-MM-DD',
    draft: 'still a draft pending legal review (OQ-06)',
    served_version_differs: 'GET /api/v1/config serves a different version from the document',
    document_missing: `${version} is missing`,
    document_empty: `${version} is empty`,
    document_outdated: `${version} was written for an older version`,
    non_western_digit: `${version} contains Arabic-Indic digits (FR-022)`,
    contact_placeholder: 'the contact address is still a placeholder (prerequisite P-12)',
    contact_invalid: 'the contact address is not an email address',
  };
  return kind === undefined ? messages[problem] : `${DOCUMENT_NAMES[kind]}: ${messages[problem]}`;
}

export interface PolicyReleaseReport {
  readonly passed: boolean;
  readonly lines: readonly string[];
}

/** The release check's output: one line per problem, then a summary. */
export function policyReleaseReport(problems: readonly PolicyProblem[]): PolicyReleaseReport {
  if (problems.length === 0) {
    return {
      passed: true,
      lines: ['Policy documents: both documents are complete in English and Arabic.'],
    };
  }
  return {
    passed: false,
    lines: [
      ...problems.map((problem) => `- ${describePolicyProblem(problem)}`),
      `Policy documents: ${problems.length} problem(s); the release is blocked (FR-039 criterion 5).`,
    ],
  };
}

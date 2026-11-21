import { describe, expect, it } from 'vitest';
import {
  checkPolicies,
  describePolicyProblem,
  POLICY_LIBRARY,
  policyDocument,
  policyReleaseReport,
  policyTexts,
} from './index.js';
import type { PolicyDocument, PolicyLibrary } from './index.js';

const document = (version: string, heading: string, text: string): PolicyDocument => ({
  version,
  sections: [{ id: 'data', heading, blocks: [{ kind: 'paragraph', text }] }],
});

const PRIVACY_EN = document('2', 'What is stored', 'Your email address.');
const TERMS_AR = document('3', 'من يحق له الاستخدام', 'من بلغوا 18 عامًا فأكثر.');

/** Both documents final, in both languages, with a contact address: nothing to report. */
const COMPLETE: PolicyLibrary = {
  versions: {
    privacy: { version: '2', effectiveDate: '2026-12-01', draft: false },
    terms: { version: '3', effectiveDate: '2026-12-01', draft: false },
  },
  documents: {
    privacy: {
      en: PRIVACY_EN,
      ar: document('2', 'ما الذي نحفظه', 'عنوان بريدك الإلكتروني.'),
    },
    terms: {
      en: document('3', 'Who may use it', 'People aged 18 or over.'),
      ar: TERMS_AR,
    },
  },
  contact: { kind: 'email', address: 'privacy@masareef.example' },
};

const SERVED = { privacy: '2', terms: '3' } as const;

describe('release check (FR-039 criterion 5)', () => {
  it('release_check_passes_with_complete_fixture_documents', () => {
    expect(checkPolicies(COMPLETE, SERVED)).toEqual([]);
    expect(policyReleaseReport([])).toEqual({
      passed: true,
      lines: ['Policy documents: both documents are complete in English and Arabic.'],
    });
  });

  it('release_check_fails_when_arabic_document_missing', () => {
    const library: PolicyLibrary = {
      ...COMPLETE,
      documents: { ...COMPLETE.documents, privacy: { en: PRIVACY_EN } },
    };
    const problems = checkPolicies(library, SERVED);
    expect(problems).toEqual([{ kind: 'privacy', language: 'ar', problem: 'document_missing' }]);
    const report = policyReleaseReport(problems);
    expect(report.passed).toBe(false);
    expect(report.lines.join('\n')).toContain('privacy policy: the Arabic version is missing');
  });

  it('release_check_fails_when_english_document_missing', () => {
    const library: PolicyLibrary = {
      ...COMPLETE,
      documents: { ...COMPLETE.documents, terms: { ar: TERMS_AR } },
    };
    expect(checkPolicies(library, SERVED)).toEqual([
      { kind: 'terms', language: 'en', problem: 'document_missing' },
    ]);
  });

  it('a_document_with_no_sections_or_blank_text_is_empty', () => {
    const library: PolicyLibrary = {
      ...COMPLETE,
      documents: {
        privacy: { ...COMPLETE.documents.privacy, ar: { version: '2', sections: [] } },
        terms: { ...COMPLETE.documents.terms, en: document('3', 'Heading', '   ') },
      },
    };
    expect(checkPolicies(library, SERVED)).toEqual([
      { kind: 'privacy', language: 'ar', problem: 'document_empty' },
      { kind: 'terms', language: 'en', problem: 'document_empty' },
    ]);
  });

  it('a_translation_written_for_an_older_version_is_reported', () => {
    const library: PolicyLibrary = {
      ...COMPLETE,
      documents: {
        ...COMPLETE.documents,
        privacy: { ...COMPLETE.documents.privacy, ar: document('1', 'ما الذي نحفظه', 'نص.') },
      },
    };
    expect(checkPolicies(library, SERVED)).toEqual([
      { kind: 'privacy', language: 'ar', problem: 'document_outdated' },
    ]);
  });

  for (const version of ['', ' ', '0', '1.0', 'v2', '٢']) {
    it(`version_${JSON.stringify(version)}_is_not_a_version`, () => {
      const library: PolicyLibrary = {
        ...COMPLETE,
        versions: { ...COMPLETE.versions, terms: { ...COMPLETE.versions.terms, version } },
      };
      expect(checkPolicies(library, { ...SERVED, terms: version })).toContainEqual({
        kind: 'terms',
        problem: 'version_invalid',
      });
    });
  }

  for (const effectiveDate of ['', '2026-02-30', '2026-12-1', '01/12/2026', '٢٠٢٦-١٢-٠١']) {
    it(`effective_date_${JSON.stringify(effectiveDate)}_is_not_a_valid_date`, () => {
      const library: PolicyLibrary = {
        ...COMPLETE,
        versions: {
          ...COMPLETE.versions,
          privacy: { ...COMPLETE.versions.privacy, effectiveDate },
        },
      };
      expect(checkPolicies(library, SERVED)).toEqual([
        { kind: 'privacy', problem: 'effective_date_invalid' },
      ]);
    });
  }

  it('versions_served_by_config_must_equal_the_documents', () => {
    expect(checkPolicies(COMPLETE, { privacy: '2', terms: '2' })).toEqual([
      { kind: 'terms', problem: 'served_version_differs' },
    ]);
  });

  it('a_placeholder_contact_address_blocks_the_release', () => {
    const problems = checkPolicies({ ...COMPLETE, contact: { kind: 'placeholder' } }, SERVED);
    expect(problems).toEqual([{ problem: 'contact_placeholder' }]);
    expect(describePolicyProblem(problems[0]!)).toBe(
      'the contact address is still a placeholder (prerequisite P-12)',
    );
  });

  for (const address of ['', 'privacy', 'privacy@', '@masareef.example', 'a b@c.example']) {
    it(`contact_${JSON.stringify(address)}_is_not_an_email_address`, () => {
      const library: PolicyLibrary = { ...COMPLETE, contact: { kind: 'email', address } };
      expect(checkPolicies(library, SERVED)).toEqual([{ problem: 'contact_invalid' }]);
    });
  }

  it('a_draft_cannot_be_released', () => {
    const library: PolicyLibrary = {
      ...COMPLETE,
      versions: { ...COMPLETE.versions, privacy: { ...COMPLETE.versions.privacy, draft: true } },
    };
    expect(checkPolicies(library, SERVED)).toEqual([{ kind: 'privacy', problem: 'draft' }]);
  });

  it('arabic_indic_digits_in_a_document_are_reported', () => {
    const library: PolicyLibrary = {
      ...COMPLETE,
      documents: {
        ...COMPLETE.documents,
        terms: { ...COMPLETE.documents.terms, ar: document('3', 'العمر', 'من بلغوا ١٨ عامًا.') },
      },
    };
    expect(checkPolicies(library, SERVED)).toEqual([
      { kind: 'terms', language: 'ar', problem: 'non_western_digit' },
    ]);
  });

  it('every_problem_has_a_message_naming_the_document_and_language', () => {
    expect(
      describePolicyProblem({ kind: 'terms', language: 'en', problem: 'document_outdated' }),
    ).toBe('terms of use: the English version was written for an older version');
    expect(describePolicyProblem({ kind: 'privacy', problem: 'served_version_differs' })).toBe(
      'privacy policy: GET /api/v1/config serves a different version from the document',
    );
    const report = policyReleaseReport([
      { problem: 'contact_placeholder' },
      { kind: 'terms', problem: 'draft' },
    ]);
    expect(report).toEqual({
      passed: false,
      lines: [
        '- the contact address is still a placeholder (prerequisite P-12)',
        '- terms of use: still a draft pending legal review (OQ-06)',
        'Policy documents: 2 problem(s); the release is blocked (FR-039 criterion 5).',
      ],
    });
  });
});

describe('the shipped documents', () => {
  it('today_only_the_contact_address_and_draft_status_block_the_release', () => {
    const served = {
      privacy: POLICY_LIBRARY.versions.privacy.version,
      terms: POLICY_LIBRARY.versions.terms.version,
    };
    expect(checkPolicies(POLICY_LIBRARY, served)).toEqual([
      { kind: 'privacy', problem: 'draft' },
      { kind: 'terms', problem: 'draft' },
      { problem: 'contact_placeholder' },
    ]);
  });
});

describe('policyDocument never substitutes another language (FR-039 criterion 5)', () => {
  it('gives_the_document_in_the_language_asked_for', () => {
    expect(policyDocument(COMPLETE, 'privacy', 'ar')).toBe(COMPLETE.documents.privacy.ar);
    expect(policyDocument(COMPLETE, 'privacy', 'en')).toBe(COMPLETE.documents.privacy.en);
  });

  it('gives_nothing_when_that_language_is_missing_empty_or_outdated', () => {
    const missing: PolicyLibrary = {
      ...COMPLETE,
      documents: {
        privacy: { en: PRIVACY_EN },
        terms: { ...COMPLETE.documents.terms, ar: document('2', 'العمر', 'نص قديم.') },
      },
    };
    expect(policyDocument(missing, 'privacy', 'ar')).toBeUndefined();
    expect(policyDocument(missing, 'terms', 'ar')).toBeUndefined();
    const empty: PolicyLibrary = {
      ...COMPLETE,
      documents: { ...COMPLETE.documents, terms: { en: { version: '3', sections: [] } } },
    };
    expect(policyDocument(empty, 'terms', 'en')).toBeUndefined();
  });
});

describe('policyTexts', () => {
  it('lists_headings_and_every_run_of_text_in_order', () => {
    const texts = policyTexts({
      version: '1',
      sections: [
        {
          id: 'a',
          heading: 'Heading',
          blocks: [
            { kind: 'paragraph', text: ['Stored in ', { name: 'Cloudflare' }, ' in the EU.'] },
            { kind: 'list', items: ['One', ['Two ', { link: '/terms', text: 'terms' }]] },
            { kind: 'contact', text: 'Write to:' },
            { kind: 'pending', text: 'To be written.' },
          ],
        },
      ],
    });
    expect(texts).toEqual([
      'Heading',
      'Stored in ',
      'Cloudflare',
      ' in the EU.',
      'One',
      'Two ',
      'terms',
      'Write to:',
      'To be written.',
    ]);
  });
});

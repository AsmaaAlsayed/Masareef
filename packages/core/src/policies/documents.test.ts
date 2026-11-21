import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../language.js';
import { POLICY_KINDS, POLICY_LIBRARY, POLICY_SOURCES, policyTexts } from './index.js';
import type { PolicyDocument, PolicyRun } from './index.js';

const LATIN_LETTER = /[A-Za-z]/;
const ARABIC_LETTER = /[؀-ۿ]/;

/** The pages a document may link to: public routes of architecture C1. */
const PUBLIC_PAGES = ['/privacy', '/terms', '/download', '/delete-account'];

function shipped(kind: (typeof POLICY_KINDS)[number], language: 'en' | 'ar'): PolicyDocument {
  const document = POLICY_LIBRARY.documents[kind][language];
  if (document === undefined) throw new Error(`${kind} ${language} is not shipped`);
  return document;
}

/** Every run of every block, so names and links can be checked by type. */
function runs(document: PolicyDocument): PolicyRun[] {
  return document.sections.flatMap((section) =>
    section.blocks.flatMap((block) => {
      const texts = block.kind === 'list' ? block.items : [block.text];
      return texts.flatMap((text) => (typeof text === 'string' ? [text] : [...text]));
    }),
  );
}

describe('the shipped policy documents', () => {
  for (const kind of POLICY_KINDS) {
    it(`${kind}_has_the_same_sections_in_both_languages_each_with_its_sources`, () => {
      const ids = shipped(kind, 'en').sections.map((section) => section.id);
      expect(shipped(kind, 'ar').sections.map((section) => section.id)).toEqual(ids);
      expect(Object.keys(POLICY_SOURCES[kind]).sort()).toEqual([...ids].sort());
      for (const id of ids) expect(POLICY_SOURCES[kind][id]?.length, id).toBeGreaterThan(0);
    });

    it(`${kind}_arabic_has_latin_letters_only_in_proper_names`, () => {
      const document = shipped(kind, 'ar');
      for (const run of runs(document)) {
        if (typeof run === 'string') expect(run).not.toMatch(LATIN_LETTER);
        else if ('link' in run) expect(run.text).not.toMatch(LATIN_LETTER);
      }
      for (const section of document.sections) expect(section.heading).not.toMatch(LATIN_LETTER);
    });

    it(`${kind}_english_has_no_arabic_letters`, () => {
      for (const text of policyTexts(shipped(kind, 'en'))) expect(text).not.toMatch(ARABIC_LETTER);
    });

    it(`${kind}_links_only_to_public_pages_and_has_one_contact_and_one_legal_gap`, () => {
      for (const language of LANGUAGES) {
        const document = shipped(kind, language);
        for (const run of runs(document)) {
          if (typeof run !== 'string' && 'link' in run) expect(PUBLIC_PAGES).toContain(run.link);
        }
        const blocks = document.sections.flatMap((section) => section.blocks);
        expect(blocks.filter((block) => block.kind === 'contact')).toHaveLength(1);
        expect(blocks.filter((block) => block.kind === 'pending')).toHaveLength(1);
      }
    });
  }

  it('the_privacy_policy_has_a_section_for_each_statement_of_fr039_c3', () => {
    // Data stored and why; voice audio; usage statistics; hosting; deletion; 18 or over;
    // retention; contact. The wording is checked by the legal review (T-086), not here.
    const ids = shipped('privacy', 'en').sections.map((section) => section.id);
    for (const id of ['stored', 'voice', 'statistics', 'hosting', 'deletion', 'age']) {
      expect(ids).toContain(id);
    }
    expect(ids).toEqual(expect.arrayContaining(['retention', 'contact']));
  });

  it('the_drafts_are_version_1_effective_21_nov_2026', () => {
    for (const kind of POLICY_KINDS) {
      expect(POLICY_LIBRARY.versions[kind]).toEqual({
        version: '1',
        effectiveDate: '2026-11-21',
        draft: true,
      });
    }
  });
});

import type { Language } from '../language.js';

/** The two public documents of FR-039, at `/privacy` and `/terms`. */
export type PolicyKind = 'privacy' | 'terms';

export const POLICY_KINDS: readonly PolicyKind[] = Object.freeze(['privacy', 'terms']);

/**
 * One piece of running text: a plain string, or runs of text where some runs are
 *
 * - a proper name kept in its own script, such as a company name inside Arabic text, shown
 *   isolated left to right so it neither reorders nor is reordered by the text around it;
 * - a link to another page of the site, with its text in the document's language.
 */
export type PolicyText = string | readonly PolicyRun[];

export type PolicyRun =
  string | { readonly name: string } | { readonly link: `/${string}`; readonly text: string };

export type PolicyBlock =
  | { readonly kind: 'paragraph'; readonly text: PolicyText }
  | { readonly kind: 'list'; readonly items: readonly PolicyText[] }
  /** A sentence introducing the operator's contact address, followed by the address itself. */
  | { readonly kind: 'contact'; readonly text: PolicyText }
  /** A marked gap: text that only the legal review can supply (OQ-06). */
  | { readonly kind: 'pending'; readonly text: PolicyText };

export interface PolicySection {
  /** Stable and the same in both languages, so a checklist can find a section (T-086). */
  readonly id: string;
  readonly heading: string;
  readonly blocks: readonly PolicyBlock[];
}

/** One document in one language. */
export interface PolicyDocument {
  /**
   * The version this text was written for. It must equal the document's current version: a
   * translation left behind when the other language was revised counts as missing, so it is
   * never shown as if it were current.
   */
  readonly version: string;
  readonly sections: readonly PolicySection[];
}

/** The current version of a document, which `GET /config` serves and each page shows. */
export interface PolicyVersion {
  /** A whole number written in Western digits, raised by one for every published change. */
  readonly version: string;
  /** The day the version takes effect, `YYYY-MM-DD`. */
  readonly effectiveDate: string;
  /** A draft is shown under a banner saying it is not legal text; it cannot be released. */
  readonly draft: boolean;
}

/** How to reach the operator about privacy (FR-039 criterion 3). */
export type PolicyContact =
  /** The address does not exist yet (prerequisite P-12): the pages say it will be published. */
  { readonly kind: 'placeholder' } | { readonly kind: 'email'; readonly address: string };

/**
 * Everything the pages and the release check read. A language may be absent from `documents`;
 * nothing ever substitutes the other language for it (FR-039 criterion 5).
 */
export interface PolicyLibrary {
  readonly versions: Readonly<Record<PolicyKind, PolicyVersion>>;
  readonly documents: Readonly<Record<PolicyKind, Partial<Record<Language, PolicyDocument>>>>;
  readonly contact: PolicyContact;
}

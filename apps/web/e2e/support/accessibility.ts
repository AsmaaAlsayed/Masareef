import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/**
 * WCAG 2.2 levels A and AA as axe-core 4.14 tags them (NFR-025). Rules are tagged with the version
 * that introduced them, so 2.2 A and AA is the union of the 2.0, 2.1 and 2.2 A and AA tags. axe has
 * no `wcag22a` tag: WCAG 2.2 added no level A criterion that axe tests. `wcag2a-obsolete` is left
 * out on purpose: it marks the rules for criterion 4.1.1, which WCAG 2.2 removed.
 */
export const WCAG_22_A_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const;

export interface Violation {
  readonly rule: string;
  readonly impact: string;
  readonly help: string;
  /** CSS selectors of the offending elements. */
  readonly targets: readonly string[];
}

/** Runs axe on the whole page with the WCAG 2.2 A and AA rules only. */
export async function scanWcag22(page: Page): Promise<Violation[]> {
  const results = await new AxeBuilder({ page }).withTags([...WCAG_22_A_AA]).analyze();
  return results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact ?? 'unknown',
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
}

/** One line per violation, with the axe rule id first, for a readable failure message. */
export function describeViolations(violations: readonly Violation[]): string {
  return violations
    .map((v) => `${v.rule} (${v.impact}): ${v.help} -> ${v.targets.join(', ')}`)
    .join('\n');
}

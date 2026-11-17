import { describe, expect, it } from 'vitest';
import { evaluate } from './audit.js';

const TODAY = '2026-11-17';

const advisory = (url, severity, name = 'pkg') => ({ source: 1, name, url, severity });

const report = (...advisories) => ({
  vulnerabilities: Object.fromEntries(
    advisories.map((a, i) => [
      `${a.name}-${i}`,
      { name: a.name, severity: a.severity, via: [a, 'other-package'] },
    ]),
  ),
});

const exception = (id, expires = '2026-12-17') => ({ id, package: 'pkg', reason: 'test', expires });

describe('evaluate', () => {
  it('passes_when_the_report_has_no_vulnerabilities', () => {
    expect(evaluate({ vulnerabilities: {} }, [], TODAY).failures).toEqual([]);
  });

  it('fails_on_a_high_advisory_without_an_exception', () => {
    const result = evaluate(
      report(advisory('https://github.com/advisories/GHSA-aaaa-bbbb-cccc', 'high')),
      [],
      TODAY,
    );
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toContain('GHSA-aaaa-bbbb-cccc');
  });

  it('fails_on_a_critical_advisory_without_an_exception', () => {
    const result = evaluate(
      report(advisory('https://github.com/advisories/GHSA-aaaa-bbbb-cccc', 'critical')),
      [],
      TODAY,
    );
    expect(result.failures).toHaveLength(1);
  });

  it('ignores_low_and_moderate_advisories', () => {
    const result = evaluate(
      report(
        advisory('https://github.com/advisories/GHSA-1111-2222-3333', 'moderate'),
        advisory('https://github.com/advisories/GHSA-4444-5555-6666', 'low'),
      ),
      [],
      TODAY,
    );
    expect(result.failures).toEqual([]);
  });

  it('passes_a_high_advisory_covered_by_an_unexpired_exception_and_reports_it', () => {
    const result = evaluate(
      report(advisory('https://github.com/advisories/GHSA-aaaa-bbbb-cccc', 'high')),
      [exception('GHSA-aaaa-bbbb-cccc')],
      TODAY,
    );
    expect(result.failures).toEqual([]);
    expect(result.accepted).toEqual(['GHSA-aaaa-bbbb-cccc']);
  });

  it('fails_when_the_exception_has_expired', () => {
    const result = evaluate(
      report(advisory('https://github.com/advisories/GHSA-aaaa-bbbb-cccc', 'high')),
      [exception('GHSA-aaaa-bbbb-cccc', '2026-11-16')],
      TODAY,
    );
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toContain('expired');
  });

  it('still_accepts_on_the_expiry_date_itself', () => {
    const result = evaluate(
      report(advisory('https://github.com/advisories/GHSA-aaaa-bbbb-cccc', 'high')),
      [exception('GHSA-aaaa-bbbb-cccc', TODAY)],
      TODAY,
    );
    expect(result.failures).toEqual([]);
  });

  it('an_exception_covers_only_its_own_advisory', () => {
    const result = evaluate(
      report(
        advisory('https://github.com/advisories/GHSA-aaaa-bbbb-cccc', 'high'),
        advisory('https://github.com/advisories/GHSA-dddd-eeee-ffff', 'high'),
      ),
      [exception('GHSA-aaaa-bbbb-cccc')],
      TODAY,
    );
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toContain('GHSA-dddd-eeee-ffff');
  });

  it('warns_about_an_exception_no_longer_needed', () => {
    const result = evaluate({ vulnerabilities: {} }, [exception('GHSA-aaaa-bbbb-cccc')], TODAY);
    expect(result.failures).toEqual([]);
    expect(result.unused).toEqual(['GHSA-aaaa-bbbb-cccc']);
  });

  it('fails_on_an_exception_entry_without_id_reason_or_valid_expiry', () => {
    const bad = [{ id: 'GHSA-aaaa-bbbb-cccc', reason: '', expires: 'soon' }];
    const result = evaluate({ vulnerabilities: {} }, bad, TODAY);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toContain('invalid');
  });

  it('fails_when_the_report_cannot_be_read', () => {
    expect(evaluate({ error: { summary: 'network' } }, [], TODAY).failures).toHaveLength(1);
  });
});

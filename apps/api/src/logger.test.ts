import { describe, expect, it } from 'vitest';
import { createLogger } from './logger.js';

const REQUEST_ID = '6f1c1f0e-7a50-4a53-9c37-0d6a7a3f2b11';
const EMAIL = 'seeded.marker@example.com';
const MARKER = 'seeded-marker-value';

/** Takes any record: these tests exercise the run-time guard, not the compile-time type. */
function logged(fields: Record<string, unknown>): { line: string; entry: Record<string, unknown> } {
  const lines: string[] = [];
  createLogger((line) => lines.push(line))(fields);
  expect(lines).toHaveLength(1);
  const line = lines[0] ?? '';
  return { line, entry: JSON.parse(line) as Record<string, unknown> };
}

describe('logger', () => {
  it('logger_drops_fields_not_on_allow_list', () => {
    const { line, entry } = logged({
      level: 'info',
      request_id: REQUEST_ID,
      email: EMAIL,
      password: MARKER,
      token: MARKER,
      ip: MARKER,
      amount: MARKER,
      note: MARKER,
      body: { email: EMAIL },
    });
    expect(entry).toEqual({ level: 'info', request_id: REQUEST_ID });
    expect(line).not.toContain(EMAIL);
    expect(line).not.toContain(MARKER);
  });

  it('keeps_every_allowed_field_with_a_valid_value', () => {
    const fields = {
      ts: '2026-11-19T10:00:00.000Z',
      level: 'error',
      request_id: REQUEST_ID,
      method: 'GET',
      route: '/api/v1/expenses/:id',
      status: 500,
      duration_ms: 12,
      release: 'abc123',
      client: 'android/1.2.3',
      error_code: 'internal',
      missing_variables: ['RELEASE'],
    };
    expect(logged(fields).entry).toEqual(fields);
  });

  it.each([
    ['level', 'verbose'],
    ['request_id', EMAIL],
    ['method', EMAIL],
    ['route', `/api/v1/users/${EMAIL}`],
    ['route', '/api/v1/expenses?note=lunch'],
    ['status', EMAIL],
    ['status', 99],
    ['duration_ms', EMAIL],
    ['duration_ms', -1],
    ['release', EMAIL],
    ['client', EMAIL],
    ['error_code', EMAIL],
    ['ts', EMAIL],
    ['missing_variables', [EMAIL]],
    ['missing_variables', EMAIL],
    ['stack', 42],
  ])('drops_allowed_field_%s_with_unsafe_value_%j', (field, value) => {
    expect(logged({ [field]: value }).entry).toEqual({});
  });

  it('keeps_stack_frames_but_not_the_error_message', () => {
    const stack = [
      `Error: could not save ${EMAIL}`,
      '    at saveExpense (index.js:10:5)',
      '    at async handler (index.js:20:3)',
      '    at index.js:30:1',
      `    at ${EMAIL}`,
    ].join('\n');
    const { line, entry } = logged({ stack });
    expect(line).not.toContain(EMAIL);
    expect(entry['stack']).toBe(
      'at saveExpense (index.js:10:5)\nat async handler (index.js:20:3)\nat index.js:30:1',
    );
  });

  it('omits_a_stack_with_no_frames', () => {
    expect(logged({ level: 'error', stack: `Error: ${EMAIL}` }).entry).toEqual({ level: 'error' });
  });
});

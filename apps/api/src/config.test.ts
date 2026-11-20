import { describe, expect, it } from 'vitest';
import { ConfigurationError, loadConfig } from './config.js';

const database = {};

function failure(values: Record<string, unknown>): ConfigurationError {
  try {
    loadConfig(values);
  } catch (error) {
    if (error instanceof ConfigurationError) return error;
    throw error;
  }
  throw new Error('loadConfig accepted the configuration');
}

describe('loadConfig', () => {
  it('missing_required_variable_fails_with_named_error', () => {
    const error = failure({ DB: database });
    expect(error.variables).toEqual(['RELEASE']);
    expect(error.message).toContain('RELEASE');
  });

  it('names_a_missing_database_binding', () => {
    expect(failure({ RELEASE: 'abc123' }).variables).toEqual(['DB']);
  });

  it('names_every_missing_variable', () => {
    expect(failure({}).variables).toEqual(['DB', 'RELEASE']);
  });

  it.each(['', '   ', 42, null])('treats_release_value_%j_as_missing', (release) => {
    expect(failure({ DB: database, RELEASE: release }).variables).toEqual(['RELEASE']);
  });

  it('returns_the_release_when_complete', () => {
    expect(loadConfig({ DB: database, RELEASE: 'abc123' })).toEqual({
      release: 'abc123',
      googleClientId: null,
    });
  });

  it.each([undefined, '', '   '])('google_client_id_%j_is_optional_and_reads_as_null', (value) => {
    expect(
      loadConfig({ DB: database, RELEASE: 'r1', GOOGLE_CLIENT_ID: value }).googleClientId,
    ).toBe(null);
  });

  it('returns_a_configured_google_client_id', () => {
    const id = '123456789012-abcdefghijklmnopqrstuvwxyz012345.apps.googleusercontent.com';
    expect(loadConfig({ DB: database, RELEASE: 'r1', GOOGLE_CLIENT_ID: ` ${id} ` })).toEqual({
      release: 'r1',
      googleClientId: id,
    });
  });

  it.each([
    'not-a-client-id',
    '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al',
    '123-abc.apps.googleusercontent.com.evil.example',
    'https://123-abc.apps.googleusercontent.com',
    42,
  ])('rejects_google_client_id_%j_by_name', (value) => {
    const error = failure({ DB: database, RELEASE: 'r1', GOOGLE_CLIENT_ID: value });
    expect(error.variables).toEqual(['GOOGLE_CLIENT_ID']);
    expect(error.message).toContain('GOOGLE_CLIENT_ID');
    expect(error.message).not.toContain(String(value));
  });

  it('names_missing_and_invalid_variables_together', () => {
    expect(failure({ DB: database, GOOGLE_CLIENT_ID: 'x' }).variables).toEqual([
      'RELEASE',
      'GOOGLE_CLIENT_ID',
    ]);
  });
});

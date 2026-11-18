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
    expect(loadConfig({ DB: database, RELEASE: 'abc123' })).toEqual({ release: 'abc123' });
  });
});

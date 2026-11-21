import { describe, expect, it } from 'vitest';
import { SCREENS } from './screens.js';
import { text } from './support/text.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe('the screen inventory', () => {
  it('lists the skeleton page in its ready, loading and error states', () => {
    const home = SCREENS.find((screen) => screen.path === '/');
    expect(home?.states.map((state) => state.name)).toEqual(
      expect.arrayContaining(['ready', 'loading', 'error']),
    );
  });

  it('names screens and states so screenshot names are unique and portable', () => {
    const ids = SCREENS.map((screen) => screen.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const screen of SCREENS) {
      expect(screen.id).toMatch(SLUG);
      const states = screen.states.map((state) => state.name);
      expect(states.length, screen.id).toBeGreaterThan(0);
      expect(new Set(states).size, screen.id).toBe(states.length);
      states.forEach((state) => expect(state).toMatch(SLUG));
    }
  });

  it('lists each path once, from the origin', () => {
    const paths = SCREENS.map((screen) => screen.path);
    expect(new Set(paths).size).toBe(paths.length);
    paths.forEach((path) => expect(path).toMatch(/^\//));
  });

  it('marks states with texts that exist in both languages', () => {
    for (const screen of SCREENS) {
      for (const { marker } of screen.states) {
        if ('textKey' in marker && marker.textKey !== undefined) {
          expect(text('en', marker.textKey)).not.toBe('');
          expect(text('ar', marker.textKey)).not.toBe('');
        }
      }
    }
  });
});

describe('text', () => {
  it('reads a nested text in each language', () => {
    expect(text('en', 'pages.signIn')).toBe('Sign in');
    expect(text('ar', 'pages.signIn')).not.toBe('Sign in');
  });

  it('refuses a key that leads to a group rather than a text', () => {
    // @ts-expect-error -- `pages` is a group of texts, not a text
    expect(() => text('en', 'pages')).toThrow('No en text for pages');
  });
});

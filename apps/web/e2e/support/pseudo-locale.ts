/**
 * The pseudo-locale (architecture, "How each NFR is met", NFR-009): every English text, accented,
 * lengthened by about 40% and wrapped in brackets, so text that a layout cuts off shows up, both to
 * the automatic check below and to a person looking at the screenshots (a missing closing bracket).
 *
 * It exists only in this test harness. The app is not changed: the harness generates the texts
 * from the English resources at test time and, in the browser under test, replaces each text node
 * that holds an English text with its pseudo-locale form, before the first paint and on every
 * later render. Nothing of it is in the web build, so no user can reach it.
 */
import { englishTexts } from './text.js';

// prettier-ignore
const ACCENTED: Readonly<Record<string, string>> = {
  a: 'å', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'î', j: 'ĵ', k: 'ķ', l: 'ļ',
  m: 'ɱ', n: 'ñ', o: 'ö', p: 'þ', q: 'ǫ', r: 'ŕ', s: 'š', t: 'ţ', u: 'û', v: 'ṽ', w: 'ŵ', x: 'ẋ',
  y: 'ý', z: 'ž', A: 'Å', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Î', J: 'Ĵ',
  K: 'Ķ', L: 'Ļ', M: 'Ṁ', N: 'Ñ', O: 'Ö', P: 'Þ', Q: 'Ǫ', R: 'Ŕ', S: 'Š', T: 'Ţ', U: 'Û', V: 'Ṽ',
  W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž',
};

/** How much longer than the English text the pseudo-locale text is, before the brackets. */
export const PSEUDO_EXPANSION = 0.4;

/** Interpolation placeholders (`{{count}}`) are kept as they are, so values still fill them. */
const PLACEHOLDER = /(\{\{[^}]+\}\})/;

/** `Sign in` becomes `[Šîĝñ îñ ~~~]`. Padding comes in words of at most five, so it can wrap. */
export function pseudoLocalize(english: string): string {
  const accented = english
    .split(PLACEHOLDER)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : Array.from(part)
            .map((character) => ACCENTED[character] ?? character)
            .join(''),
    )
    .join('');
  const padding = Math.max(2, Math.ceil(english.length * PSEUDO_EXPANSION));
  const words = Array.from({ length: Math.ceil(padding / 5) }, (_, index) =>
    '~'.repeat(Math.min(5, padding - index * 5)),
  );
  return `[${accented} ${words.join(' ')}]`;
}

/** English text and its pseudo-locale form, for every text in the English resources. */
export function pseudoLocaleTexts(): [english: string, pseudo: string][] {
  return englishTexts().map((english) => [english, pseudoLocalize(english)]);
}

/*
 * The functions below run in the browser under test (page.addInitScript, page.evaluate), so each
 * one is self-contained: it uses nothing from this module.
 */

/** Replaces English texts in the page with their pseudo-locale forms, now and on every change. */
export function installPseudoLocale(pairs: readonly (readonly [string, string])[]): void {
  const exact = new Map<string, string>();
  const templates: [RegExp, string][] = [];
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [english, pseudo] of pairs) {
    if (!english.includes('{{')) {
      exact.set(english, pseudo);
      continue;
    }
    const pattern = english
      .split(/\{\{[^}]+\}\}/)
      .map(escape)
      .join('(.*?)');
    templates.push([new RegExp(`^${pattern}$`, 's'), pseudo]);
  }

  const localize = (node: Node) => {
    const raw = node.nodeValue ?? '';
    const trimmed = raw.trim();
    if (trimmed === '') return;
    let pseudo = exact.get(trimmed);
    if (pseudo === undefined) {
      for (const [pattern, template] of templates) {
        const match = pattern.exec(trimmed);
        if (match === null) continue;
        const values = match.slice(1);
        pseudo = template.replace(/\{\{[^}]+\}\}/g, () => values.shift() ?? '');
        break;
      }
    }
    // A pseudo-locale text matches no English text, so this never triggers itself again.
    if (pseudo !== undefined) node.nodeValue = raw.replace(trimmed, pseudo);
  };

  const localizeTree = (root: Node) => {
    if (root.nodeType === Node.TEXT_NODE) {
      localize(root);
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) localize(node);
  };

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') localize(mutation.target);
      else mutation.addedNodes.forEach(localizeTree);
    }
  }).observe(document, { childList: true, characterData: true, subtree: true });
}

export interface TextProblem {
  /** Tag name, with its id or classes when it has them. */
  readonly element: string;
  readonly text: string;
  readonly detail: string;
}

/**
 * Elements whose text does not fit: content wider or taller than the box, where the box hides the
 * overflow (`overflow: hidden` or `clip`, which includes text cut with an ellipsis) or where it
 * spills the text over its neighbours (a box with text of its own that overflows visibly). Boxes
 * that scroll (`auto`, `scroll`) are not counted: their text can be reached.
 */
export function findClippedText(): TextProblem[] {
  const problems: TextProblem[] = [];
  const describe = (element: Element) =>
    element.tagName.toLowerCase() +
    (element.id === '' ? '' : `#${element.id}`) +
    Array.from(element.classList, (name) => `.${name}`).join('');
  const hasOwnText = (element: Element) =>
    Array.from(element.childNodes).some(
      (node) => node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? '').trim() !== '',
    );

  for (const element of Array.from(document.body.querySelectorAll('*'))) {
    if (!(element instanceof HTMLElement) || !element.checkVisibility()) continue;
    const style = getComputedStyle(element);
    if (style.display === 'inline' || style.display === 'contents') continue;
    const text = (element.textContent ?? '').trim();
    if (text === '') continue;

    const tolerance = 1;
    const overflows = {
      inline: element.scrollWidth > element.clientWidth + tolerance,
      block: element.scrollHeight > element.clientHeight + tolerance,
    };
    const hides = (value: string) => value === 'hidden' || value === 'clip';
    const clippedInline = overflows.inline && hides(style.overflowX);
    const clippedBlock = overflows.block && hides(style.overflowY);
    const spills =
      hasOwnText(element) &&
      ((overflows.inline && style.overflowX === 'visible') ||
        (overflows.block && style.overflowY === 'visible'));
    if (!clippedInline && !clippedBlock && !spills) continue;

    problems.push({
      element: describe(element),
      text: text.slice(0, 80),
      detail:
        `${clippedInline || clippedBlock ? 'clipped' : 'overflows its box'}: content ` +
        `${element.scrollWidth}x${element.scrollHeight} in ${element.clientWidth}x${element.clientHeight}`,
    });
  }
  return problems;
}

/**
 * Visible text that the pseudo-locale did not reach: text that is not from the English resources,
 * so the clipping check above says nothing about how its translations fit. Values from the server
 * or the user (inside `<bdi>`) and text marked as another language (the language control names
 * the other language in that language) are expected and skipped.
 */
export function findTextOutsidePseudoLocale(): TextProblem[] {
  const pageLanguage = document.documentElement.lang;
  const problems: TextProblem[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = (node.nodeValue ?? '').trim();
    const parent = node.parentElement;
    if (text === '' || parent === null || !/\p{L}/u.test(text)) continue;
    if (!parent.checkVisibility() || parent.closest('bdi, script, style') !== null) continue;
    const marked = parent.closest('[lang]');
    if (marked !== null && marked.getAttribute('lang') !== pageLanguage) continue;
    if (text.startsWith('[') && text.endsWith(']')) continue;
    problems.push({ element: parent.tagName.toLowerCase(), text, detail: 'not pseudo-localised' });
  }
  return problems;
}

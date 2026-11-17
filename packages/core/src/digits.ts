const ARABIC_INDIC_ZERO = 0x0660;
const EASTERN_ARABIC_ZERO = 0x06f0;

/**
 * Replaces Arabic-Indic (U+0660 to U+0669) and Eastern Arabic (U+06F0 to U+06F9) digits with
 * Western digits (FR-022 criterion 4). Every other character, separators included, is
 * returned unchanged.
 */
export function toWesternDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (digit) => {
    const codePoint = digit.charCodeAt(0);
    const zero = codePoint >= EASTERN_ARABIC_ZERO ? EASTERN_ARABIC_ZERO : ARABIC_INDIC_ZERO;
    return String(codePoint - zero);
  });
}

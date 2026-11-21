import {
  AMOUNT_LABEL_SEPARATOR,
  DEFAULT_LANGUAGE,
  formatAmountParts,
  isLanguage,
} from '@masareef/core';
import type { CurrencyCode } from '@masareef/core';
import { useTranslation } from 'react-i18next';

export interface AmountProps {
  /** The amount in the currency's minor unit (piastres, fils): 123450 is 1,234.50 EGP. */
  readonly minor: number;
  readonly currency: CurrencyCode;
}

/**
 * An amount as text: the number in `<bdi dir="ltr">`, so right-to-left layout never reorders its
 * digits, then a no-break space and the currency label in the interface language, "1,234.50 EGP"
 * or "1,234.50 ج.م" (FR-022 criterion 2, architecture C1). In Arabic the label therefore sits to
 * the left of the number, after it in reading order.
 */
export function Amount({ minor, currency }: AmountProps) {
  const { i18n } = useTranslation();
  const language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
  const { number, label } = formatAmountParts(minor, currency, language);
  return (
    <span className="amount">
      <bdi dir="ltr">{number}</bdi>
      {AMOUNT_LABEL_SEPARATOR}
      {label}
    </span>
  );
}

export interface UserTextProps {
  readonly text: string;
}

/**
 * Text a user typed, such as a note: isolated in `<bdi dir="auto">` so it takes its own direction
 * from its first strong letter without moving what is around it (FR-020 criterion 3), and shown
 * exactly as typed, Arabic-Indic digits included (FR-022 criterion 5). React renders it as text.
 */
export function UserText({ text }: UserTextProps) {
  return <bdi dir="auto">{text}</bdi>;
}

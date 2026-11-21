import { useTranslation } from 'react-i18next';
import { useWebApp } from './web-app-context.js';

/**
 * On every screen (it is in the layout). Names the other language in that language, the usual
 * convention for a language control, and marks it with `lang` so screen readers pronounce it
 * correctly. Switching re-renders in place: nothing below the layout is unmounted (FR-021 c3).
 */
export function LanguageSwitch() {
  const { i18n } = useTranslation();
  const app = useWebApp();
  const other = i18n.language === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      className="language-switch"
      lang={other}
      data-language-switch=""
      onClick={() => app.chooseLanguage(other)}
    >
      {i18n.getFixedT(other)('language.name')}
    </button>
  );
}

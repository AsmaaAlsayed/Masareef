import type { PolicyKind } from '@masareef/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { configQuery } from '../config-query.js';
import { useWebApp } from '../web-app-context.js';
import { usePolicyNoticeAudience } from './audience.js';
import { changedPolicies } from './notice.js';
import type { PolicyVersions } from './notice.js';

/** On every screen (it is in the layout): tells the user a document has a new version. */
export function PolicyNotice() {
  return <PolicyNoticeFor eligible={usePolicyNoticeAudience()} />;
}

interface PolicyNoticeForProps {
  /** Whether this user is shown the notice at all (audience.ts). */
  readonly eligible: boolean;
}

/**
 * Compares the versions `GET /config` serves with those this device last saw (FR-039 criterion
 * 4). When one differs, it shows a notice linking to each changed document, until the user
 * dismisses it, which records the current versions as seen. A device that has seen nothing gets
 * the current versions recorded and no notice. While the configuration is loading or has failed,
 * nothing is shown and nothing is recorded.
 *
 * The live region is always in the page, empty until there is a notice, so screen readers announce
 * the notice when it appears, without interrupting (`aria-live="polite"`).
 */
export function PolicyNoticeFor({ eligible }: PolicyNoticeForProps) {
  const { t } = useTranslation();
  const app = useWebApp();
  const titleId = useId();
  const config = useQuery({ ...configQuery(app.api), enabled: eligible });
  const [changed, setChanged] = useState<readonly PolicyKind[]>([]);

  const current: PolicyVersions | undefined =
    eligible && config.data !== undefined
      ? { privacy: config.data.privacyVersion, terms: config.data.termsVersion }
      : undefined;
  const privacy = current?.privacy;
  const terms = current?.terms;

  useEffect(() => {
    if (privacy === undefined || terms === undefined) return;
    const now = { privacy, terms };
    const seen = app.policySeen.read();
    if (seen === undefined) app.policySeen.write(now);
    setChanged(changedPolicies(seen, now));
  }, [app.policySeen, privacy, terms]);

  const dismiss = () => {
    if (current !== undefined) app.policySeen.write(current);
    setChanged([]);
  };

  return (
    <div aria-live="polite" className="policy-notice-region">
      {current === undefined || changed.length === 0 ? null : (
        <aside className="policy-notice" aria-labelledby={titleId}>
          <h2 id={titleId}>{t('policyNotice.title')}</h2>
          <p>{t('policyNotice.body')}</p>
          <ul>
            {changed.map((kind) => (
              <li key={kind}>
                <Link to={`/${kind}`}>{t(`pages.${kind}`)}</Link>
              </li>
            ))}
          </ul>
          <button type="button" onClick={dismiss}>
            {t('policyNotice.dismiss')}
          </button>
        </aside>
      )}
    </div>
  );
}

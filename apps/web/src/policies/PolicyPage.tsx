import { DEFAULT_LANGUAGE, formatDate, isLanguage, policyDocument } from '@masareef/core';
import type {
  PolicyBlock,
  PolicyContact,
  PolicyKind,
  PolicyRun,
  PolicySection,
  PolicyText,
} from '@masareef/core';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useWebApp } from '../web-app-context.js';

/**
 * `/privacy` and `/terms` (FR-039 criteria 1 and 4): the document in the interface language, its
 * version and effective date, and a banner while it is a draft. Public: it needs no session and no
 * request. When the text in the interface language is missing, empty or written for another
 * version, the page says so in that language and shows no document text: it never falls back to
 * the other language (FR-039 criterion 5).
 */
export function PolicyPage({ kind }: { readonly kind: PolicyKind }) {
  const { t, i18n } = useTranslation();
  const { policies } = useWebApp();
  const language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
  const { version, effectiveDate, draft } = policies.versions[kind];
  const content = policyDocument(policies, kind, language);

  return (
    <article className="policy">
      <h1>{t(`pages.${kind}`)}</h1>
      {draft ? (
        <div role="note" className="policy-draft">
          <p className="policy-draft-title">{t('policy.draftTitle')}</p>
          <p>{t('policy.draftBody')}</p>
        </div>
      ) : null}
      {content === undefined ? (
        <p>{t('policy.notAvailable')}</p>
      ) : (
        <>
          <dl className="facts policy-facts">
            <dt>{t('policy.version')}</dt>
            <dd>
              <bdi dir="ltr">{version}</bdi>
            </dd>
            <dt>{t('policy.effectiveDate')}</dt>
            <dd>
              <bdi>
                <time dateTime={effectiveDate}>{formatDate(effectiveDate, language)}</time>
              </bdi>
            </dd>
          </dl>
          {content.sections.map((section) => (
            <Section key={section.id} section={section} contact={policies.contact} />
          ))}
        </>
      )}
    </article>
  );
}

function Section({
  section,
  contact,
}: {
  readonly section: PolicySection;
  readonly contact: PolicyContact;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{section.heading}</h2>
      {section.blocks.map((block, index) => (
        <Block key={index} block={block} contact={contact} />
      ))}
    </section>
  );
}

function Block({
  block,
  contact,
}: {
  readonly block: PolicyBlock;
  readonly contact: PolicyContact;
}) {
  const { t } = useTranslation();
  switch (block.kind) {
    case 'paragraph':
      return (
        <p>
          <Text text={block.text} />
        </p>
      );
    case 'list':
      return (
        <ul>
          {block.items.map((item, index) => (
            <li key={index}>
              <Text text={item} />
            </li>
          ))}
        </ul>
      );
    case 'contact':
      return (
        <>
          <p>
            <Text text={block.text} />
          </p>
          <p className="policy-contact">
            {contact.kind === 'email' ? (
              <bdi dir="ltr">
                <a href={mailTo(contact.address)}>{contact.address}</a>
              </bdi>
            ) : (
              t('policy.contactPending')
            )}
          </p>
        </>
      );
    case 'pending':
      return (
        <div className="policy-pending">
          <p className="policy-pending-label">{t('policy.pendingLabel')}</p>
          <p>
            <Text text={block.text} />
          </p>
        </div>
      );
  }
}

/** A link that opens a new email to the address. */
const mailTo = (address: string) => `mailto:${address}`;

/** Document text: plain runs as text, proper names isolated left to right, links to the site. */
function Text({ text }: { readonly text: PolicyText }) {
  if (typeof text === 'string') return text;
  return text.map((run, index) => <Run key={index} run={run} />);
}

function Run({ run }: { readonly run: PolicyRun }) {
  if (typeof run === 'string') return run;
  if ('name' in run) {
    return (
      <bdi dir="ltr" translate="no">
        {run.name}
      </bdi>
    );
  }
  return <Link to={run.link}>{run.text}</Link>;
}

import { ApiError } from '@masareef/api-types';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useWebApp } from './web-app-context.js';

/** The skeleton page: proves the build, the API client and both languages end to end. */
export function HomePage() {
  const { t } = useTranslation();
  const { api } = useWebApp();
  const config = useQuery({
    queryKey: ['config'],
    queryFn: ({ signal }) => api.getConfig({ signal }),
  });

  return (
    <>
      <h1>{t('app.name')}</h1>
      {config.isPending ? (
        <p role="status">{t('status.loading')}</p>
      ) : config.isError ? (
        <ErrorMessage error={config.error} onRetry={() => void config.refetch()} />
      ) : (
        <dl className="facts">
          <dt>{t('home.release')}</dt>
          <dd>
            <bdi dir="ltr">{config.data.release}</bdi>
          </dd>
        </dl>
      )}
    </>
  );
}

interface ErrorMessageProps {
  readonly error: Error;
  readonly onRetry: () => void;
}

/** A translated message, never the server's code, and the request id when there is one (NFR-028). */
function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const { t } = useTranslation();
  const apiError = error instanceof ApiError ? error : undefined;
  const requestId = apiError?.requestId;
  return (
    <div role="alert" className="error">
      <p>{t(apiError?.code === 'network_error' ? 'errors.network' : 'errors.generic')}</p>
      {requestId === undefined ? null : (
        <p>
          {t('errors.reference')} <bdi dir="ltr">{requestId}</bdi>
        </p>
      )}
      <button type="button" onClick={onRetry}>
        {t('actions.retry')}
      </button>
    </div>
  );
}

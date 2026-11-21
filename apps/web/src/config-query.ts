import type { ApiClient } from '@masareef/api-types';
import { queryOptions } from '@tanstack/react-query';

/**
 * `GET /config`, read by the home page and by the policy change notice on every screen. One query
 * key, so the screens share one request and one cached answer.
 */
export function configQuery(api: ApiClient) {
  return queryOptions({
    queryKey: ['config'],
    queryFn: ({ signal }) => api.getConfig({ signal }),
  });
}

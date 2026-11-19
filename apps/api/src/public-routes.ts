export interface PublicRoute {
  readonly method: 'GET' | 'POST';
  readonly path: string;
}

/**
 * The only routes that answer without a session (architecture, "Authorisation"). Everything else
 * is denied by middleware/access-control.ts. A path matches only when it is written exactly like
 * this on the wire. A `GET` entry also covers `HEAD`, which runs the same handler without a body.
 */
export const PUBLIC_ROUTES: readonly PublicRoute[] = [
  { method: 'GET', path: '/api/v1/health/live' },
  { method: 'GET', path: '/api/v1/health/ready' },
];

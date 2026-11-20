// Generated from apps/api/openapi.json by `npm run openapi:generate`. Do not edit by hand.

export interface paths {
  '/api/v1/config': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Public settings for the clients */
    get: operations['getConfig'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/health/live': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** The Worker answers */
    get: operations['getLiveness'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/health/ready': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** A SELECT 1 on the database succeeds within 2 seconds */
    get: operations['getReadiness'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    Config: {
      /** @description Google's public OAuth web client id; null while Google sign-in is not set up */
      googleClientId: string | null;
      /** @description Current version of the privacy policy */
      privacyVersion: string;
      /** @description The running build (commit SHA once deployed) */
      release: string;
      /** @description Current version of the terms */
      termsVersion: string;
    };
    /** @description RFC 9457 problem details. `code` is stable and is what the client translates; `request_id` matches the X-Request-Id header. */
    Problem: {
      /** @enum {string} */
      code:
        | 'validation_failed'
        | 'unauthenticated'
        | 'not_found'
        | 'too_large'
        | 'internal'
        | 'not_ready';
      /** @description Present for validation_failed: one entry per rejected field. */
      errors?: {
        code: string;
        field: string;
      }[];
      request_id: string;
      status: number;
      title: string;
      type: string;
    };
    Status: {
      /** @enum {string} */
      status: 'ok';
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  getConfig: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description The public configuration */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Config'];
        };
      };
      /** @description Internal Server Error (internal: an unexpected failure or incomplete configuration) */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/problem+json': components['schemas']['Problem'];
        };
      };
    };
  };
  getLiveness: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Alive */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Status'];
        };
      };
      /** @description Internal Server Error (internal: an unexpected failure or incomplete configuration) */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/problem+json': components['schemas']['Problem'];
        };
      };
    };
  };
  getReadiness: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Ready */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Status'];
        };
      };
      /** @description Internal Server Error (internal: an unexpected failure or incomplete configuration) */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/problem+json': components['schemas']['Problem'];
        };
      };
      /** @description Service Unavailable (not_ready: a dependency is unavailable) */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/problem+json': components['schemas']['Problem'];
        };
      };
    };
  };
}

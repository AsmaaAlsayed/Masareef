import { createRoute, z } from '@hono/zod-openapi';
import { createRouter, problemResponses } from '../openapi.js';
import { POLICY_VERSIONS } from '../policies.js';

/**
 * What a client needs before it can do anything, per environment, so that one web build serves
 * every environment (architecture, "Environments and deployment"). Public values only: each field
 * is listed here and nothing else from the configuration is ever copied in.
 */
export const ConfigSchema = z
  .strictObject({
    googleClientId: z.string().nullable().openapi({
      description: "Google's public OAuth web client id; null while Google sign-in is not set up",
    }),
    termsVersion: z.string().openapi({ description: 'Current version of the terms' }),
    privacyVersion: z.string().openapi({ description: 'Current version of the privacy policy' }),
    release: z.string().openapi({ description: 'The running build (commit SHA once deployed)' }),
  })
  .openapi('Config');

const getConfig = createRoute({
  method: 'get',
  path: '/config',
  operationId: 'getConfig',
  tags: ['config'],
  summary: 'Public settings for the clients',
  responses: {
    200: {
      description: 'The public configuration',
      content: { 'application/json': { schema: ConfigSchema } },
    },
    ...problemResponses(500),
  },
});

export const configRoutes = createRouter().openapi(getConfig, (c) => {
  const { googleClientId, release } = c.get('config');
  return c.json(
    {
      googleClientId,
      termsVersion: POLICY_VERSIONS.terms,
      privacyVersion: POLICY_VERSIONS.privacy,
      release,
    },
    200,
  );
});

// The only module that knows the application runs on Cloudflare Workers (ADR 0004 exit path).
// Running on Node with a SQLite file means writing another implementation of Platform.
import { drizzle } from 'drizzle-orm/d1';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

export type Database = BaseSQLiteDatabase<'async', unknown>;

export interface WorkerBindings {
  DB?: D1Database;
  RELEASE?: string;
  GOOGLE_CLIENT_ID?: string;
  /** The web build (Workers Static Assets). Absent in tests that exercise the API alone. */
  ASSETS?: Fetcher;
}

export interface Deadline {
  readonly expired: Promise<void>;
  cancel(): void;
}

export interface Platform {
  /** Raw configuration values by name, validated by loadConfig. */
  readonly configuration: Readonly<Record<string, unknown>>;
  database(): Database;
  now(): number;
  newRequestId(): string;
  startDeadline(milliseconds: number): Deadline;
  readonly writeLog: (line: string) => void;
  /**
   * Answers a page or file request from the web build, falling back to index.html for client-side
   * routes. `undefined` when no web build is attached. The response's headers can be changed.
   */
  readonly serveStatic: ((request: Request) => Promise<Response>) | undefined;
}

function startTimerDeadline(milliseconds: number): Deadline {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, milliseconds);
  });
  return { expired, cancel: () => clearTimeout(timer) };
}

/**
 * The binding applies `not_found_handling` from wrangler.jsonc. Its response is copied, because the
 * security headers are added afterwards and a fetched response's headers may be immutable.
 */
function serveFrom(assets: Fetcher): (request: Request) => Promise<Response> {
  return async (request) => {
    const response = await assets.fetch(request);
    return new Response(response.body, response);
  };
}

export function createWorkersPlatform(
  bindings: WorkerBindings,
  overrides: Partial<Pick<Platform, 'startDeadline'>> = {},
): Platform {
  return {
    configuration: {
      DB: bindings.DB,
      RELEASE: bindings.RELEASE,
      GOOGLE_CLIENT_ID: bindings.GOOGLE_CLIENT_ID,
    },
    database() {
      if (!bindings.DB) throw new Error('The DB binding is not configured');
      return drizzle(bindings.DB);
    },
    now: () => Date.now(),
    newRequestId: () => crypto.randomUUID(),
    startDeadline: overrides.startDeadline ?? startTimerDeadline,
    writeLog: (line) => console.log(line),
    serveStatic: bindings.ASSETS ? serveFrom(bindings.ASSETS) : undefined,
  };
}

// The only module that knows the application runs on Cloudflare Workers (ADR 0004 exit path).
// Running on Node with a SQLite file means writing another implementation of Platform.
import { drizzle } from 'drizzle-orm/d1';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

export type Database = BaseSQLiteDatabase<'async', unknown>;

export interface WorkerBindings {
  DB?: D1Database;
  RELEASE?: string;
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
}

function startTimerDeadline(milliseconds: number): Deadline {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, milliseconds);
  });
  return { expired, cancel: () => clearTimeout(timer) };
}

export function createWorkersPlatform(
  bindings: WorkerBindings,
  overrides: Partial<Pick<Platform, 'startDeadline'>> = {},
): Platform {
  return {
    configuration: { DB: bindings.DB, RELEASE: bindings.RELEASE },
    database() {
      if (!bindings.DB) throw new Error('The DB binding is not configured');
      return drizzle(bindings.DB);
    },
    now: () => Date.now(),
    newRequestId: () => crypto.randomUUID(),
    startDeadline: overrides.startDeadline ?? startTimerDeadline,
    writeLog: (line) => console.log(line),
  };
}

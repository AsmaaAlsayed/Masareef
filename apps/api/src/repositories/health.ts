import { sql } from 'drizzle-orm';
import type { Database } from '../platform.js';

export async function selectOne(database: Database): Promise<void> {
  await database.get(sql`SELECT 1`);
}

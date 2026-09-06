/**
 * Applies pending drizzle migrations to the database in DATABASE_URL.
 *
 *   bun run db:migrate:run
 *
 * Uses drizzle-orm's migrator rather than drizzle-kit so the deployed machine
 * only needs production dependencies. Resolves the migrations folder for both
 * the repo layout and the deployed release layout, or MIGRATIONS_DIR if set.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url: string | undefined = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const candidates: string[] = [
	process.env.MIGRATIONS_DIR,
	// deployed release: <release>/scripts/migrate.ts alongside <release>/migrations
	fileURLToPath(new URL('../migrations', import.meta.url)),
	// repo checkout
	fileURLToPath(new URL('../src/lib/server/db/migrations', import.meta.url))
].filter((c): c is string => Boolean(c));

const migrationsFolder: string | undefined = candidates.find((c) => existsSync(c));
if (!migrationsFolder) {
	throw new Error(`No migrations folder found. Looked in:\n  ${candidates.join('\n  ')}`);
}

console.log(`Applying migrations from ${migrationsFolder}`);

// max: 1 so the advisory lock drizzle takes is held on a single connection
const client = postgres(url, { max: 1 });
try {
	await migrate(drizzle(client), { migrationsFolder });
	console.log('Migrations up to date.');
} finally {
	await client.end();
}

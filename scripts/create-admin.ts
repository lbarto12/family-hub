/**
 * Creates an admin user from scratch.
 *
 *   bun run db:admin
 *
 * Talks to the database directly rather than going through UsersAPI, because
 * `$lib/server/db` resolves `$env/dynamic/private` and that alias only exists
 * inside a SvelteKit build.
 */
import readline from 'node:readline/promises';
import { Writable } from 'node:stream';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { profiles, users, type Profile, type User } from '../src/lib/server/db/schemas';
import { getFirst } from '../src/lib/server/domains/utils';
import {
	UserCreateRequestSchema,
	type UserCreateRequest
} from '../src/lib/types/rpcs/private/users/users';

// Terminal emulation only when stdin really is a terminal; with a pipe it
// double-echoes and swallows lines
const interactive: boolean = process.stdin.isTTY === true;

let muted = false;

// Wraps stdout so the password prompt can stop echoing keystrokes without
// giving up readline's line editing
const output = new Writable({
	write(chunk: unknown, _encoding: BufferEncoding, callback: () => void): void {
		if (!muted) process.stdout.write(chunk as Buffer);
		callback();
	}
});

const rl = readline.createInterface({ input: process.stdin, output, terminal: interactive });

const ask = async (question: string): Promise<string> => {
	const answer = await rl.question(`${question}: `);
	return answer.trim();
};

const askHidden = async (question: string): Promise<string> => {
	process.stdout.write(`${question}: `);
	muted = interactive;
	const answer = await rl.question('');
	muted = false;
	process.stdout.write('\n');
	return answer;
};

const fail: (message: string) => never = (message: string): never => {
	console.error(`\n✗ ${message}`);
	process.exit(1);
};

const main = async (): Promise<undefined> => {
	const url: string | undefined = process.env.DATABASE_URL;
	if (!url) fail('DATABASE_URL is not set');

	console.log('Creating an admin user.\n');

	const email = await ask('Email');
	const firstName = await ask('First name');
	const lastName = await ask('Last name');
	const phoneNumber = await ask('Phone number');
	const password = await askHidden('Password');
	const confirm = await askHidden('Confirm password');
	rl.close();

	if (password !== confirm) fail('passwords do not match');
	if (password.length < 8) fail('password must be at least 8 characters');

	const parsed = UserCreateRequestSchema.safeParse({
		email,
		password,
		firstName,
		lastName,
		phoneNumber
	});
	if (!parsed.success) {
		fail(
			parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n  ')
		);
	}

	const input: UserCreateRequest = parsed.data;
	const client = postgres(url);
	const db = drizzle(client);

	try {
		const existing = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, input.email.toLowerCase()));
		if (existing.length > 0) fail(`a user already exists with email ${input.email}`);

		const passHash: string = await Bun.password.hash(input.password);

		const user: User = await db.transaction(async (tx): Promise<User> => {
			const created: User = await tx
				.insert(users)
				.values({
					email: input.email.toLowerCase(),
					passwordHash: passHash,
					role: 'admin'
				})
				.returning()
				.then(getFirst);

			const profile: Profile = await tx
				.insert(profiles)
				.values({
					userID: created.id,
					firstName: input.firstName,
					lastName: input.lastName,
					phoneNumber: input.phoneNumber
				})
				.returning()
				.then(getFirst);

			console.log(`\n✓ created admin ${profile.firstName} ${profile.lastName}`);
			return created;
		});

		console.log(`  ${user.email}`);
		console.log(`  ${user.id}`);
	} finally {
		await client.end();
	}
};

await main();

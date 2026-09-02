import crypto from 'crypto';

import {
	JWT_SECRET,
	JWT_ISSUER,
	JWT_AUDIENCE,
	JWT_ACCESS_TOKEN_TTL,
	REFRESH_TOKEN_TTL_DAYS
} from '$env/static/private';
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';
import { refreshTokens, type RefreshToken } from '$lib/server/db/schemas';
import { db } from '$lib/server/db';
import { getFirst } from '../utils';
import type { db as DB } from '$lib/server/db';
import { and, eq, gt } from 'drizzle-orm';
type Executor = typeof DB | Parameters<Parameters<typeof DB.transaction>[0]>[0];

if (!JWT_SECRET || !JWT_ISSUER || !JWT_AUDIENCE || !JWT_ACCESS_TOKEN_TTL || !REFRESH_TOKEN_TTL_DAYS)
	throw Error('JWT_SECRET not set');

const secret = new TextEncoder().encode(JWT_SECRET);
const refreshTokenTTLDays: number = parseInt(REFRESH_TOKEN_TTL_DAYS);

export const generateRefreshToken = (): string => {
	return crypto.randomBytes(32).toString('base64url');
};

export const hashRefreshToken = (raw: string): string => {
	return crypto.createHash('sha256').update(raw).digest('hex');
};

export const signAccessToken = (userID: string): Promise<string> => {
	return new SignJWT({})
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(userID)
		.setIssuedAt()
		.setIssuer(JWT_ISSUER)
		.setAudience(JWT_AUDIENCE)
		.setExpirationTime(JWT_ACCESS_TOKEN_TTL)
		.setJti(Bun.randomUUIDv7())
		.sign(secret);
};

export const verifyAccessToken = async (token: string): Promise<JWTPayload> => {
	const { payload } = await jwtVerify(token, secret, {
		issuer: JWT_ISSUER,
		audience: JWT_AUDIENCE,
		algorithms: ['HS256']
	});

	return payload;
};

export interface IssuedRefreshToken {
	raw: string;
	issued: RefreshToken;
}

const issueRefreshTokenTx = async (
	executor: Executor,
	userID: string,
	familyID: string | undefined
): Promise<IssuedRefreshToken> => {
	const raw: string = generateRefreshToken();
	const hash: string = hashRefreshToken(raw);
	const family: string = familyID ?? Bun.randomUUIDv7();
	const expiresAt: Date = new Date();
	expiresAt.setDate(expiresAt.getDate() + refreshTokenTTLDays);
	const token: RefreshToken = await executor
		.insert(refreshTokens)
		.values({ userID, familyID: family, hash, expiresAt })
		.returning()
		.then(getFirst);
	return { raw, issued: token };
};

export const issueRefreshToken = (userID: string, familyID?: string): Promise<IssuedRefreshToken> =>
	issueRefreshTokenTx(db, userID, familyID);

export type RotateResult =
	| { ok: true; raw: string; issued: RefreshToken; userID: string; familyID: string }
	| { ok: false; reason: 'invalid' | 'expired' | 'revoked' | 'reuse' };

export const rotateRefreshToken = async (raw: string): Promise<RotateResult> => {
	const hash: string = hashRefreshToken(raw);

	return db.transaction(async (tx): Promise<RotateResult> => {
		// Atomic claim: flip used false→true only if currently usable.
		// Postgres serializes concurrent updates to the row, so at most one
		// caller gets a row back. Destructure (not getFirst) — zero rows is an
		// expected outcome here, not an error.
		const claimed: RefreshToken | undefined = await tx
			.update(refreshTokens)
			.set({ used: true })
			.where(
				and(
					eq(refreshTokens.hash, hash),
					eq(refreshTokens.used, false),
					eq(refreshTokens.revoked, false),
					gt(refreshTokens.expiresAt, new Date())
				)
			)
			.returning()
			.then(getFirst);

		if (claimed) {
			const next: IssuedRefreshToken = await issueRefreshTokenTx(
				tx,
				claimed.userID,
				claimed.familyID
			);
			return {
				ok: true,
				raw: next.raw,
				issued: next.issued,
				userID: claimed.userID,
				familyID: claimed.familyID
			};
		}

		// Claim failed → diagnose against a consistent in-tx read.
		const record: RefreshToken | undefined = (
			await tx.select().from(refreshTokens).where(eq(refreshTokens.hash, hash))
		)[0];
		if (record.revoked) return { ok: false, reason: 'revoked' };
		if (record.expiresAt <= new Date()) return { ok: false, reason: 'expired' };

		// Not revoked, not expired, but claim failed → already used → REUSE.
		// Poison the whole family; the attacker's branch dies with it.
		await tx
			.update(refreshTokens)
			.set({ revoked: true })
			.where(eq(refreshTokens.familyID, record.familyID));
		return { ok: false, reason: 'reuse' };
	});
};

// ─── revocation ──────────────────────────────────────────────────────────────

export const revokeFamilyById = async (familyID: string): Promise<void> => {
	await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.familyID, familyID));
};

// logout: kill the session lineage the presented token belongs to
export const revokeFamilyByToken = async (raw: string): Promise<void> => {
	const hash: string = hashRefreshToken(raw);
	const record = (
		await db
			.select({ familyID: refreshTokens.familyID })
			.from(refreshTokens)
			.where(eq(refreshTokens.hash, hash))
	).at(0);
	if (record) {
		await revokeFamilyById(record.familyID);
	}
};

// logout-all: kill every family for a user (e.g. after password change)
export const revokeUserTokens = async (userID: string): Promise<void> => {
	await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.userID, userID));
};

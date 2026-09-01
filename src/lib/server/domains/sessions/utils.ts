import crypto from "crypto";

import { JWT_SECRET, JWT_ISSUER, JWT_AUDIENCE, JWT_ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL_DAYS } from "$env/static/private";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { refreshTokens, type RefreshToken } from "$lib/server/db/schemas";
import { db } from "$lib/server/db";
import { getFirst } from "../utils";

if (!JWT_SECRET || !JWT_ISSUER || !JWT_AUDIENCE || !JWT_ACCESS_TOKEN_TTL || !REFRESH_TOKEN_TTL_DAYS) throw Error("JWT_SECRET not set");

const secret = new TextEncoder().encode(JWT_SECRET);
const refreshTokenTTLDays: number = parseInt(REFRESH_TOKEN_TTL_DAYS);

export const generateRefreshToken = (): string => {
    return crypto.randomBytes(32).toString("base64url");
}

export const hashRefreshToken = (raw: string): string => {
    return crypto.createHash("sha256").update(raw).digest("hex");
}

export const signAccessToken = (userID: string): Promise<string> => {
    return new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(userID)
        .setIssuedAt()
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .setExpirationTime(JWT_ACCESS_TOKEN_TTL)
        .setJti(Bun.randomUUIDv7())
        .sign(secret);
}

export const verifyAccessToken = async (token: string): Promise<JWTPayload> => {
    const { payload } = await jwtVerify(token, secret, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        algorithms: ["HS256"]
    });

    return payload;
}

export interface IssuedRefreshToken {
    raw: string;
    issued: RefreshToken;
};

export const issueRefreshToken = async (userID: string, familyID: string | undefined): Promise<IssuedRefreshToken> => {
    const raw: string = generateRefreshToken();
    const hash: string = hashRefreshToken(raw);
    const family: string = familyID ?? Bun.randomUUIDv7();

    const expiresAt: Date = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTokenTTLDays);

    const token: RefreshToken = await db
        .insert(refreshTokens)
        .values({
            userID: userID,
            familyID: family,
            hash: hash,
            expiresAt: expiresAt,
        })
        .returning()
        .then(getFirst);

    return {
        raw: raw,
        issued: token
    };
}

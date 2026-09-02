import { db } from "$lib/server/db";
import { users, type User } from "$lib/server/db/schemas";
import type { SessionBundle, SessionLoginRequest } from "$lib/types/rpcs/public/session/session";
import { eq } from "drizzle-orm";
import { getFirst, ValueNotFound } from "../utils";
import { issueRefreshToken, rotateRefreshToken, signAccessToken, type IssuedRefreshToken, type RotateResult } from "./utils";
import type { PublicORPCContext } from "$lib/server/rpc/public/orpc";
import { ORPCError } from "@orpc/client";


export const Login = async (input: SessionLoginRequest): Promise<SessionBundle> => {
    let user: User;
    try {
        user = await db
            .select()
            .from(users)
            .where(eq(users.email, input.email.toLowerCase()))
            .then(getFirst);

    } catch (error) {
        if (error instanceof ValueNotFound) {
            throw new ORPCError("UNAUTHORIZED", { message: "account not found" });
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "unknown" })
    }


    if (! await Bun.password.verify(input.password, user.passwordHash)) {
        throw new Error("invalid credentials");
    }

    const accessToken: string = await signAccessToken(user.id);
    const refreshToken: IssuedRefreshToken = await issueRefreshToken(user.id, undefined);

    return {
        access: accessToken,
        refresh: refreshToken.raw
    }
}

export const Refresh = async (context: PublicORPCContext): Promise<SessionBundle> => {
    const raw: string | undefined = context.event.cookies.get("refresh");
    if (!raw) {
        throw new ORPCError("UNAUTHORIZED", { message: "no refresh token found" });
    }

    const result: RotateResult = await rotateRefreshToken(raw);
    if (!result.ok) {
        context.event.cookies.delete("refresh", { path: "/auth/refresh" });
        throw new ORPCError("UNAUTHORIZED", { message: "invalid refresh token" });
    }

    const access: string = await signAccessToken(result.userID);

    return {
        access: access,
        refresh: result.raw
    }
}

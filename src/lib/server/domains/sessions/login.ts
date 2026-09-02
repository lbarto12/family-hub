import { db } from "$lib/server/db";
import { users, type User } from "$lib/server/db/schemas";
import type { SessionBundle, SessionLoginRequest } from "$lib/types/rpcs/public/session/session";
import { eq } from "drizzle-orm";
import { getFirst } from "../utils";
import { issueRefreshToken, signAccessToken, type IssuedRefreshToken } from "./utils";


export const Login = async (input: SessionLoginRequest): Promise<SessionBundle> => {
    const user: User = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase()))
        .then(getFirst);

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

import { SessionsAPI } from '$lib/server/domains/sessions';
import { o } from '$lib/server/rpc/public/orpc';
import { SessionBundleSchema, SessionLoginRequestSchema, type SessionBundle } from '$lib/types/rpcs/public/session/session';


export const Login = o
    .input(SessionLoginRequestSchema)
    .output(SessionBundleSchema)
    .handler(async ({ input, context }): Promise<SessionBundle> => {
        const sessionBundle: SessionBundle = await SessionsAPI.login.Login(input);

        context.event.cookies.set("refresh", sessionBundle.refresh, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/auth/refresh",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        return sessionBundle;
    });

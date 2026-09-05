import { db } from "$lib/server/db";
import { profiles, users, type Profile, type User } from "$lib/server/db/schemas";
import type { UserResponse, UserUpdateRequest } from "$lib/types/rpcs/public/users/users";
import { eq } from "drizzle-orm";
import { getFirst } from "../utils";


export const ByID = async (input: UserUpdateRequest): Promise<UserResponse> => {
    const user: User = await db
        .update(users)
        .set({
            email: input.email
        })
        .where(eq(users.id, input.userID))
        .returning()
        .then(getFirst);

    const profile: Profile = await db
        .update(profiles)
        .set({
            firstName: input.firstName,
            lastName: input.lastName,
            phoneNumber: input.phoneNumber
        })
        .where(eq(profiles.userID, input.userID))
        .returning()
        .then(getFirst);

    return {
        email: user.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber
    }
}

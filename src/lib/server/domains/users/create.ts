import { db } from '$lib/server/db';
import { profiles, users, type Profile, type User } from '$lib/server/db/schemas';
import type { UserCreateRequest, UserResponse } from '$lib/types/rpcs/public/users/users';
import { getFirst } from '$lib/server/domains/utils';

export const New = async (input: UserCreateRequest): Promise<UserResponse> => {
    const passHash: string = await Bun.password.hash(input.password);

    const user: User = await db
        .insert(users)
        .values({
            email: input.email.toLowerCase(),
            passwordHash: passHash
        })
        .returning()
        .then(getFirst);

    const profile: Profile = await db
        .insert(profiles)
        .values({
            userID: user.id,
            firstName: input.firstName,
            lastName: input.lastName,
            phoneNumber: input.phoneNumber
        })
        .returning()
        .then(getFirst);


    return {
        email: user.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber
    };
};

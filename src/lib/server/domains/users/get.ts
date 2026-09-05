import { db } from '$lib/server/db';
import { profiles, users, type Profile, type User } from '$lib/server/db/schemas';
import type { UserResponse } from '$lib/types/rpcs/private/users/users';
import { eq } from 'drizzle-orm';
import { getFirst } from '../utils';

export const ByID = async (userID: string): Promise<UserResponse> => {
	const user: User = await db.select().from(users).where(eq(users.id, userID)).then(getFirst);

	const profile: Profile = await db
		.select()
		.from(profiles)
		.where(eq(profiles.userID, userID))
		.then(getFirst);

	return {
		email: user.email,
		firstName: profile.firstName,
		lastName: profile.lastName,
		phoneNumber: profile.phoneNumber
	};
};

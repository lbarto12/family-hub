import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import { common } from "../util/common";


export const profiles = pgTable("profiles", {
    ...common(),
    userID: uuid('user_id').notNull().references(() => users.id),
    firstName: varchar('first_name').notNull(),
    lastName: varchar('last_name').notNull(),
    phoneNumber: varchar('phone_number').notNull()
});

export type Profile = typeof profiles.$inferSelect;

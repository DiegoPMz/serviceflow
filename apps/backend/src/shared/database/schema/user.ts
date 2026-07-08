import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "../helpers";

export const users = pgTable("users", {
	id: uuid("id").primaryKey(),
	name: varchar("name", { length: 200 }).notNull(),
	email: varchar("email", { length: 200 }).notNull().unique(),
	profileImageUrl: text("profile_image_url"),
	...timestamps,
});

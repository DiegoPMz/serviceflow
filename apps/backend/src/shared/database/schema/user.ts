import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sqliteNowEffort } from "../helpers";

export const users = sqliteTable(
	"users",
	{
		id: text("id", { length: 26 }).primaryKey(),
		name: text("name", { length: 200 }).notNull(),
		email: text("email", { length: 200 }).notNull(),
		pictureUrl: text("picture_url"),
		lastName: text("last_name"),
		phone: text("phone").unique(),
		externalId: text("external_id").notNull().unique(),

		createdAt: integer("created_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.$onUpdateFn(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("users_email_unique_idx").on(table.email),
		index("users_name_idx").on(table.name),
	],
);

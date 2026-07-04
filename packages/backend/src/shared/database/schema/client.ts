import { index, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "../helpers";

export const clients = pgTable(
	"clients",
	{
		id: uuid("id").primaryKey(),
		name: varchar("name", { length: 150 }).notNull(),
		phoneNumber: varchar("phone_number", { length: 20 }).notNull().unique(),
		email: varchar("email", { length: 200 }).notNull().unique(),
		...timestamps,
	},
	(table) => [index("clients_name_idx").on(table.name)],
);

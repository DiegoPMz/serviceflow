import {
	index,
	pgTable,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helpers";
import { workspaces } from "./workspace";

export const clients = pgTable(
	"clients",
	{
		id: uuid("id").primaryKey(),
		workspaceId: uuid("workspace_id")
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),
		name: varchar("name", { length: 150 }).notNull(),
		phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
		email: varchar("email", { length: 200 }).notNull(),
		...timestamps,
	},
	(table) => [
		index("clients_name_idx").on(table.name),
		uniqueIndex("client_email_workspace_idx").on(
			table.email,
			table.workspaceId,
		),
		uniqueIndex("client_phone_workspace_idx").on(
			table.phoneNumber,
			table.workspaceId,
		),
	],
);

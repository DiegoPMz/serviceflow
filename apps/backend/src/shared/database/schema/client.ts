import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sqliteNowEffort } from "../helpers";
import { workspaces } from "./workspace";

export const clients = sqliteTable(
	"clients",
	{
		id: text("id", { length: 26 }).primaryKey(),
		workspaceId: text("workspace_id")
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),
		name: text("name", { length: 150 }).notNull(),
		phoneNumber: text("phone_number", { length: 20 }).notNull(),
		email: text("email", { length: 200 }).notNull(),
		location: text("location").notNull(),

		createdAt: integer("created_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.notNull(),

		updatedAt: integer("updated_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.$onUpdateFn(() => new Date())
			.notNull(),
	},
	(table) => [
		index("clients_workspace_name_idx").on(table.workspaceId, table.name),

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

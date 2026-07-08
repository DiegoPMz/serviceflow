import { index, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "../helpers";
import { clients } from "./client";
import { users } from "./user";
import { workspaces } from "./workspace";

export const orders = pgTable(
	"orders",
	{
		id: uuid("id").primaryKey(),
		clientId: uuid("client_id")
			.references(() => clients.id)
			.notNull(),
		documentUrl: text("document_url").notNull(),
		deviceModel: varchar("device_model", { length: 100 }).notNull(),
		deviceBrand: varchar("device_brand", { length: 50 }).notNull(),
		deviceSerialNumber: varchar("device_serial_number", {
			length: 200,
		}).notNull(),
		issueDescription: text("issue_description").notNull(),
		workspaceId: uuid("workspace_id")
			.references(() => workspaces.id)
			.notNull(),
		userId: uuid("user_id")
			.references(() => users.id)
			.notNull(),
		...timestamps,
	},
	(table) => [
		index("orders_client_id_idx").on(table.clientId),
		index("orders_workspace_id_idx").on(table.workspaceId),
		index("orders_user_id_idx").on(table.userId),
	],
);

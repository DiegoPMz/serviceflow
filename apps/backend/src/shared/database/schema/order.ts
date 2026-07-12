import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sqliteNowEffort } from "../helpers";
import { clients } from "./client";
import { users } from "./user";
import { workspaces } from "./workspace";

export const orders = sqliteTable(
	"orders",
	{
		id: text("id", { length: 26 }).primaryKey(),

		workspaceId: text("workspace_id", { length: 26 })
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),

		clientId: text("client_id", { length: 26 })
			.references(() => clients.id, { onDelete: "cascade" })
			.notNull(),

		userId: text("user_id", { length: 26 })
			.references(() => users.id)
			.notNull(),

		deviceModel: text("device_model", { length: 100 }).notNull(),
		deviceBrand: text("device_brand", { length: 50 }).notNull(),
		deviceSerialNumber: text("device_serial_number", { length: 200 }).notNull(),

		documentUrl: text("document_url"),
		observations: text("observations").notNull(),

		createdAt: integer("created_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.$onUpdateFn(() => new Date())
			.notNull(),
	},
	(table) => [
		index("orders_workspace_id_idx").on(table.workspaceId),
		index("orders_client_id_idx").on(table.clientId),
		index("orders_user_id_idx").on(table.userId),
		index("orders_workspace_date_idx").on(table.workspaceId, table.createdAt),
	],
);

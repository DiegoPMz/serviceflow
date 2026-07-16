import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sqliteNowEffort } from "../helpers";
import { clients } from "./client";
import { deviceComponents } from "./device";
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

		clientNameSnapshot: text("client_name_snapshot", { length: 200 }).notNull(),
		clientEmailSnapshot: text("client_email_snapshot", {
			length: 250,
		}).notNull(),
		clientPhoneSnapshot: text("client_phone_snapshot", {
			length: 15,
		}).notNull(),
		clientLocationSnapshot: text("client_location_snapshot").notNull(),

		deviceBrandSnapshot: text("device_brand_snapshot", {
			length: 50,
		}).notNull(),
		deviceModelSnapshot: text("device_model_snapshot", {
			length: 100,
		}).notNull(),
		deviceSerialNumberSnapshot: text("device_serial_number_snapshot", {
			length: 200,
		}).notNull(),

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

export const orderComponents = sqliteTable("order_components", {
	id: text("id", { length: 26 }).primaryKey(),

	orderId: text("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),

	deviceComponentId: text("device_component_id")
		.notNull()
		.references(() => deviceComponents.id, { onDelete: "restrict" }),

	quantity: integer("quantity").notNull().default(1),

	componentNameSnapshot: text("component_name_snapshot").notNull(),
	partNumberSnapshot: text("part_number_snapshot"),

	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sqliteNowEffort)
		.notNull(),
});

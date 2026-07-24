import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sqliteNowEffort } from "../helpers";
import { clients } from "./client";
import { deviceComponents, devices } from "./device";
import { users } from "./user";
import { workspaces } from "./workspace";

export const orders = sqliteTable(
	"orders",
	{
		id: text("id", { length: 26 }).primaryKey(),
		folio: text("folio").notNull().unique(),

		workspaceId: text("workspace_id", { length: 26 })
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),

		clientId: text("client_id", { length: 26 })
			.references(() => clients.id, { onDelete: "restrict" })
			.notNull(),

		deviceId: text("device_id", { length: 26 })
			.references(() => devices.id, { onDelete: "restrict" })
			.notNull(),

		userId: text("user_id", { length: 26 })
			.references(() => users.id, { onDelete: "restrict" })
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

		userNameSnapshot: text("user_name_snapshot", {
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
		index("orders_device_id_idx").on(table.deviceId),
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
	partNumberSnapshot: text("part_number_snapshot").notNull(),
	typeSnapshot: text("type", {
		enum: ["supply", "replacement_part", "other"],
	}).notNull(),

	createdAt: integer("created_at", { mode: "timestamp" })
		.default(sqliteNowEffort)
		.notNull(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
	orderComponents: many(orderComponents),
}));

export const orderComponentsRelations = relations(
	orderComponents,
	({ one }) => ({
		order: one(orders, {
			fields: [orderComponents.orderId],
			references: [orders.id],
		}),
	}),
);

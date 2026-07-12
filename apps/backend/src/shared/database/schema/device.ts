import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sqliteNowEffort } from "../helpers";
import { clients } from "./client";
import { workspaces } from "./workspace";

export const devices = sqliteTable(
	"devices",
	{
		id: text("id", { length: 26 }).primaryKey(),
		workspaceId: text("workspace_id", { length: 26 })
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),
		clientId: text("client_id", { length: 26 })
			.references(() => clients.id, { onDelete: "cascade" })
			.notNull(),
		serialNumber: text("serial_number", { length: 200 }).notNull(),
		brand: text("brand", { length: 50 }).notNull(),
		model: text("model", { length: 100 }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.$onUpdateFn(() => new Date())
			.notNull(),
	},
	(table) => [
		index("devices_client_id_idx").on(table.clientId),
		index("devices_workspace_id_idx").on(table.workspaceId),
		uniqueIndex("devices_workspace_serial_unique_idx").on(
			table.workspaceId,
			table.serialNumber,
		),
	],
);

export const deviceComponents = sqliteTable(
	"device_components",
	{
		id: text("id", { length: 26 }).primaryKey(),
		deviceId: text("device_id", { length: 26 })
			.references(() => devices.id, { onDelete: "cascade" })
			.notNull(),
		name: text("name", { length: 150 }).notNull(),
		partNumber: text("part_number", { length: 100 }).notNull(),
		type: text("type", {
			enum: ["supply", "replacement_part", "other"],
		}).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.$onUpdateFn(() => new Date())
			.notNull(),
	},
	(table) => [
		index("device_components_device_id_idx").on(table.deviceId),
		index("device_components_device_part_idx").on(
			table.deviceId,
			table.partNumber,
		),
	],
);

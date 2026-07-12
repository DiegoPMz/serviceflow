import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sqliteNowEffort } from "../helpers";
import { users } from "./user";

export const workspaces = sqliteTable(
	"workspaces",
	{
		id: text("id", { length: 26 }).primaryKey(), // Consistencia con ULID
		name: text("name", { length: 250 }).notNull(),
		prefix: text("prefix", { length: 7 }).notNull(),
		orderCount: integer("order_count").default(0).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.$onUpdateFn(() => new Date())
			.notNull(),
	},
	(table) => [
		index("workspaces_name_idx").on(table.name),
		uniqueIndex("workspaces_prefix_unique_idx").on(table.prefix),
	],
);

export const WORKSPACE_ROLES = [
	"owner",
	"admin",
	"technician",
	"viewer",
] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const workspaceMembers = sqliteTable(
	"workspace_members",
	{
		workspaceId: text("workspace_id", { length: 26 })
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),
		userId: text("user_id", { length: 26 })
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),

		role: text("role", { enum: WORKSPACE_ROLES }).default("viewer").notNull(),

		joinedAt: integer("joined_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.$onUpdateFn(() => new Date())
			.notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.workspaceId, table.userId] }),
		index("member_workspace_idx").on(table.workspaceId),
		index("member_user_idx").on(table.userId),
	],
);

export const workspaceInvitations = sqliteTable(
	"workspace_invitations",
	{
		token: text("token", { length: 21 }).primaryKey(),

		workspaceId: text("workspace_id", { length: 26 })
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),
		role: text("role", { enum: WORKSPACE_ROLES }).default("viewer").notNull(),

		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.notNull(),
	},
	(table) => [index("invitation_workspace_idx").on(table.workspaceId)],
);

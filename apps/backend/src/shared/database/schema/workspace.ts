import {
	index,
integer,
	pgEnum,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helpers";
import { users } from "./user";

export const workspaces = pgTable(
	"workspaces",
	{
	id: uuid("id").primaryKey(),
	name: varchar("name", { length: 250 }).notNull(),
		prefix: varchar("prefix", { length: 7 }).unique().notNull(),
		orderCount: integer("order_count").default(0).notNull(),
	...timestamps,
	},
	(table) => [index("workspaces_name_idx").on(table.name)],
);

export const roleEnum = pgEnum("workspace_role", [
	"owner",
	"admin",
	"technician",
	"viewer",
]);

export const workspaceMembers = pgTable(
	"workspace_members",
	{
		workspaceId: uuid("workspace_id")
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),

		userId: uuid("user_id")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),

		role: roleEnum("role").default("viewer").notNull(),

		joinedAt: timestamp("joined_at").defaultNow().notNull(),

		...timestamps,
	},
	(table) => [
		primaryKey({ columns: [table.workspaceId, table.userId] }),
		index("member_workspace_idx").on(table.workspaceId),
		index("member_user_idx").on(table.userId),
	],
);

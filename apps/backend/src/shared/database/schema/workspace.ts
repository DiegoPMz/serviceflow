import { WORKSPACE_ROLES_ARRAY } from "@serviceflow/backend/features/workspace/common/workspace-member.model";
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
		id: text("id", { length: 26 }).primaryKey(),
		name: text("name", { length: 250 }).notNull(),
		prefix: text("prefix", { length: 7 }).notNull(),
		orderCount: integer("order_count").default(0).notNull(),

		companyName: text("company_name", { length: 150 }).notNull(),
		companyPhone: text("company_phone", { length: 50 }).notNull(),
		companyEmail: text("company_email", { length: 150 }).notNull(),
		companyAddress: text("company_address", { length: 255 }).notNull(),
		companyLogoKey: text("company_logo_key"),

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

export const workspaceMembers = sqliteTable(
	"workspace_members",
	{
		workspaceId: text("workspace_id", { length: 26 })
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),
		userId: text("user_id", { length: 26 })
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),

		role: text("role", { enum: WORKSPACE_ROLES_ARRAY })
			.default("viewer")
			.notNull(),

		joinedAt: integer("joined_at", { mode: "timestamp" })
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
		token: text("token", { length: 21 }).notNull(),

		workspaceId: text("workspace_id", { length: 26 })
			.references(() => workspaces.id, { onDelete: "cascade" })
			.notNull(),
		role: text("role", { enum: WORKSPACE_ROLES_ARRAY })
			.default("viewer")
			.notNull(),
		email: text("email").notNull(),
		emailId: text("email_id"),

		status: text("status", {
			enum: ["pending", "accepted", "cancelled", "rejected"],
		})
			.default("pending")
			.notNull(),
		acceptedAt: integer("accepted_at", { mode: "timestamp" }),
		cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
		rejectedAt: integer("rejected_at", { mode: "timestamp" }),

		expirationDays: integer("expiration_days").default(7).notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.default(sqliteNowEffort)
			.notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.workspaceId, table.email] }),
		index("invitation_workspace_idx").on(table.workspaceId),
		uniqueIndex("invitation_token_unique_idx").on(table.token),
	],
);

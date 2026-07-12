import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdateFn(() => new Date())
		.notNull(),
};

export const sqliteNowEffort = sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`;

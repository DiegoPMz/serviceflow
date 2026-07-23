import { ulid } from "ulidx";
import type { DatabaseClient, DatabaseType } from "../client";
import { clients } from "../schema";

export const seedClient = async (
	db: DatabaseType | DatabaseClient,
	overrides?: Partial<typeof clients.$inferInsert>,
) => {
	const id = overrides?.id ?? ulid();
	const now = new Date();

	const [row] = await db
		.insert(clients)
		.values({
			id,
			workspaceId: "",
			name: "Test Client",
			email: `client-${id}@example.com`,
			phoneNumber: `+52155${id.slice(-8)}`,
			location: "CDMX",
			createdAt: now,
			updatedAt: now,
			...overrides,
		})
		.returning();

	if (!row) throw new Error("Failed to create test client");
	return row;
};

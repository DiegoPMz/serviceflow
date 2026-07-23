import { ulid } from "ulidx";
import type { DatabaseClient, DatabaseType } from "../client";
import { devices } from "../schema";

export const seedDevice = async (
	tx: DatabaseClient | DatabaseType,
	overrides?: Partial<typeof devices.$inferInsert>,
) => {
	const [row] = await tx
		.insert(devices)
		.values({
			id: overrides?.id ?? ulid(),
			workspaceId: overrides?.workspaceId ?? "",
			clientId: overrides?.clientId ?? "",
			serialNumber: overrides?.serialNumber ?? `SN-${ulid()}`,
			brand: overrides?.brand ?? "Samsung",
			model: overrides?.model ?? "Galaxy S21",
			createdAt: overrides?.createdAt ?? undefined,
			updatedAt: overrides?.updatedAt ?? undefined,
		})
		.returning();

	if (!row) throw new Error("Failed to create test device");
	return row;
};

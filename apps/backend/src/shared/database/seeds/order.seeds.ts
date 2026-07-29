import { ulid } from "ulidx";
import type { DatabaseClient, DatabaseType } from "../client";
import { orders } from "../schema";

export const seedOrder = async (
	tx: DatabaseClient | DatabaseType,
	overrides?: Partial<typeof orders.$inferInsert>,
) => {
	const now = new Date();
	const id = overrides?.id ?? ulid();

	const [row] = await tx
		.insert(orders)
		.values({
			id,
			folio: overrides?.folio ?? `ORD-${id.slice(-8)}`,
			workspaceId: overrides?.workspaceId ?? "",
			clientId: overrides?.clientId ?? "",
			deviceId: overrides?.deviceId ?? "",
			userId: overrides?.userId ?? "",
			clientNameSnapshot: overrides?.clientNameSnapshot ?? "Test Client",
			clientEmailSnapshot:
				overrides?.clientEmailSnapshot ?? "client@test.com",
			clientPhoneSnapshot:
				overrides?.clientPhoneSnapshot ?? "+5215500000000",
			clientLocationSnapshot:
				overrides?.clientLocationSnapshot ?? "CDMX",
			deviceBrandSnapshot:
				overrides?.deviceBrandSnapshot ?? "Samsung",
			deviceModelSnapshot:
				overrides?.deviceModelSnapshot ?? "Galaxy S21",
			deviceSerialNumberSnapshot:
				overrides?.deviceSerialNumberSnapshot ?? "SN-1234",
			userNameSnapshot: overrides?.userNameSnapshot ?? "Test User",
			observations: overrides?.observations ?? "Test observations",
			documentKey: overrides?.documentKey ?? null,
			createdAt: now,
			updatedAt: now,
			...overrides,
		})
		.returning();

	if (!row) throw new Error("Failed to create test order");
	return row.id;
};

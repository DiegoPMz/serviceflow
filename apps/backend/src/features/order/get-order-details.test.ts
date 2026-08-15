import { describe, expect, test } from "bun:test";
import type { DatabaseClient } from "@serviceflow/backend/shared/database";
import {
	deviceComponents,
	orderComponents,
} from "@serviceflow/backend/shared/database";
import { seedClient } from "@serviceflow/backend/shared/database/seeds/client.seeds";
import { seedDevice } from "@serviceflow/backend/shared/database/seeds/device.seeds";
import { seedOrder } from "@serviceflow/backend/shared/database/seeds/order.seeds";
import { seedUser } from "@serviceflow/backend/shared/database/seeds/user.seeds";
import {
	addMember,
	seedWorkspace,
} from "@serviceflow/backend/shared/database/seeds/workspace.seeds";
import { runTestInTransaction } from "@serviceflow/backend/shared/tests";
import { ulid } from "ulidx";
import type { ComponentType } from "../device/common/device.model";
import { userDrizzleRepository } from "../user/common/user-drizzle-repository";
import { OrderDrizzleRepository } from "./common/order-drizzle-repository";
import { getOrderDetailsHandler } from "./get-order-details";

interface OrderSeedBase {
	userId: string;
	workspaceId: string;
	clientId: string;
	deviceId: string;
}

const seedBase = async (
	tx: DatabaseClient,
	userOverrides?: Parameters<typeof seedUser>[1],
): Promise<OrderSeedBase> => {
	const userId = await seedUser(tx, userOverrides);
	const workspaceId = await seedWorkspace(tx);
	await addMember(tx, { userId, workspaceId });
	const clientId = (await seedClient(tx, { workspaceId })).id;
	const deviceId = (await seedDevice(tx, { workspaceId, clientId })).id;
	return { userId, workspaceId, clientId, deviceId };
};

const seedOrderComponent = async (
	tx: DatabaseClient,
	orderId: string,
	deviceId: string,
	data: {
		name: string;
		partNumber: string;
		type: ComponentType;
		quantity: number;
	},
) => {
	const deviceComponentId = ulid();
	await tx.insert(deviceComponents).values({
		id: deviceComponentId,
		deviceId,
		name: data.name,
		partNumber: data.partNumber,
		type: data.type,
	});

	await tx.insert(orderComponents).values({
		id: ulid(),
		orderId,
		deviceComponentId,
		quantity: data.quantity,
		componentNameSnapshot: data.name,
		partNumberSnapshot: data.partNumber,
		typeSnapshot: data.type,
		createdAt: new Date(),
	});
};

describe("Get-Order-Details Integration Tests", () => {
	// ── A. Read Model ───────────────────────────────────────────────

	test("Should expose the order details read model fields", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);
			const orderId = await seedOrder(tx, {
				...base,
				folio: "TECFIX-001",
				status: "pendiente",
				observations: "Pantalla rota",
			});

			const result = await getOrderDetailsHandler({
				query: { workspaceId: base.workspaceId, orderId },
				orderRepository: OrderDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			const details = result.value;
			expect(details.id).toBe(orderId);
			expect(details.folio).toBe("TECFIX-001");
			expect(details.status).toBe("pendiente");
			expect(details.observations).toBe("Pantalla rota");
			expect(details.createdAt).toEqual(expect.any(String));
			expect(details.updatedAt).toEqual(expect.any(String));
			expect(Number.isNaN(Date.parse(details.createdAt))).toBe(false);
			expect(Number.isNaN(Date.parse(details.updatedAt))).toBe(false);

			expect(details.technician).toEqual({
				name: "Test User",
				pictureUrl: null,
			});

			expect(details.client).toEqual({
				name: "Test Client",
				phone: "+5215500000000",
				email: "client@test.com",
				location: "CDMX",
			});

			expect(details.device).toEqual({
				brand: "Samsung",
				model: "Galaxy S21",
				serialNumber: "SN-1234",
				fullName: "Samsung Galaxy S21",
			});

			expect(details.supplies).toEqual([]);
		});
	});

	test("Should return createdAt and updatedAt as ISO 8601 strings", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);
			const orderId = await seedOrder(tx, {
				...base,
				createdAt: new Date("2024-03-01T10:30:00.000Z"),
				updatedAt: new Date("2024-03-01T10:30:00.000Z"),
			});

			const result = await getOrderDetailsHandler({
				query: { workspaceId: base.workspaceId, orderId },
				orderRepository: OrderDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.createdAt).toBe("2024-03-01T10:30:00.000Z");
			expect(result.value.updatedAt).toBe("2024-03-01T10:30:00.000Z");
		});
	});

	test("Should return a trimmed device full name when brand snapshot is blank", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);
			const orderId = await seedOrder(tx, {
				...base,
				deviceBrandSnapshot: " ",
				deviceModelSnapshot: "Galaxy S21",
			});

			const result = await getOrderDetailsHandler({
				query: { workspaceId: base.workspaceId, orderId },
				orderRepository: OrderDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.device.fullName).toBe("Galaxy S21");
		});
	});

	// ── B. Technician Picture ───────────────────────────────────────

	test("Should return the technician picture URL when the user has one", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx, {
				pictureUrl: "https://example.com/avatar.png",
			});
			const orderId = await seedOrder(tx, base);

			const result = await getOrderDetailsHandler({
				query: { workspaceId: base.workspaceId, orderId },
				orderRepository: OrderDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.technician.pictureUrl).toBe(
				"https://example.com/avatar.png",
			);
		});
	});

	test("Should return null picture URL when the technician has no picture", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);
			const orderId = await seedOrder(tx, base);

			const result = await getOrderDetailsHandler({
				query: { workspaceId: base.workspaceId, orderId },
				orderRepository: OrderDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.technician.pictureUrl).toBeNull();
		});
	});

	test("Should still return details when the technician user no longer exists", async () => {
		await runTestInTransaction(async (tx) => {
			const workspaceId = await seedWorkspace(tx);
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const deviceId = (await seedDevice(tx, { workspaceId, clientId })).id;
			const orderId = await seedOrder(tx, {
				workspaceId,
				clientId,
				deviceId,
				userId: ulid(),
			});

			const result = await getOrderDetailsHandler({
				query: { workspaceId, orderId },
				orderRepository: OrderDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.technician.name).toBe("Test User");
			expect(result.value.technician.pictureUrl).toBeNull();
		});
	});

	// ── C. Supplies ─────────────────────────────────────────────────

	test("Should map a single order component to its supply", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);
			const orderId = await seedOrder(tx, base);
			await seedOrderComponent(tx, orderId, base.deviceId, {
				name: "Batería",
				partNumber: "BAT-001",
				type: "supply",
				quantity: 2,
			});

			const result = await getOrderDetailsHandler({
				query: { workspaceId: base.workspaceId, orderId },
				orderRepository: OrderDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.supplies).toHaveLength(1);
			expect(result.value.supplies[0]).toEqual({
				name: "Batería",
				partNumber: "BAT-001",
				quantity: 2,
				type: "supply",
			});
		});
	});

	test("Should preserve multiple supplies with mixed types", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);
			const orderId = await seedOrder(tx, base);
			await seedOrderComponent(tx, orderId, base.deviceId, {
				name: "Batería",
				partNumber: "BAT-001",
				type: "supply",
				quantity: 1,
			});
			await seedOrderComponent(tx, orderId, base.deviceId, {
				name: "Pantalla",
				partNumber: "SCR-001",
				type: "replacement_part",
				quantity: 1,
			});
			await seedOrderComponent(tx, orderId, base.deviceId, {
				name: "Pasta térmica",
				partNumber: "OTH-001",
				type: "other",
				quantity: 3,
			});

			const result = await getOrderDetailsHandler({
				query: { workspaceId: base.workspaceId, orderId },
				orderRepository: OrderDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.supplies).toHaveLength(3);

			const battery = result.value.supplies.find(
				(s) => s.partNumber === "BAT-001",
			);
			expect(battery).toEqual({
				name: "Batería",
				partNumber: "BAT-001",
				quantity: 1,
				type: "supply",
			});

			const screen = result.value.supplies.find(
				(s) => s.partNumber === "SCR-001",
			);
			expect(screen?.type).toBe("replacement_part");
			expect(screen?.name).toBe("Pantalla");

			const thermalPaste = result.value.supplies.find(
				(s) => s.partNumber === "OTH-001",
			);
			expect(thermalPaste?.type).toBe("other");
			expect(thermalPaste?.quantity).toBe(3);
		});
	});

	// ── D. Isolation ────────────────────────────────────────────────

	test("Should isolate by order ID within the same workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const firstUserId = await seedUser(tx, {
				pictureUrl: "https://example.com/first.png",
			});
			const secondUserId = await seedUser(tx, {
				pictureUrl: "https://example.com/second.png",
			});
			const workspaceId = await seedWorkspace(tx);
			await addMember(tx, { userId: firstUserId, workspaceId });
			await addMember(tx, { userId: secondUserId, workspaceId });
			const clientId = (await seedClient(tx, { workspaceId })).id;
			const deviceId = (await seedDevice(tx, { workspaceId, clientId })).id;

			const firstOrderId = await seedOrder(tx, {
				workspaceId,
				clientId,
				deviceId,
				userId: firstUserId,
				folio: "ORD-1",
				userNameSnapshot: "First User",
			});
			await seedOrder(tx, {
				workspaceId,
				clientId,
				deviceId,
				userId: secondUserId,
				folio: "ORD-2",
				userNameSnapshot: "Second User",
			});

			const result = await getOrderDetailsHandler({
				query: { workspaceId, orderId: firstOrderId },
				orderRepository: OrderDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isSuccess).toBe(true);
			expect(result.value.id).toBe(firstOrderId);
			expect(result.value.folio).toBe("ORD-1");
			expect(result.value.technician.name).toBe("First User");
			expect(result.value.technician.pictureUrl).toBe(
				"https://example.com/first.png",
			);
		});
	});

	// ── E. Failures ─────────────────────────────────────────────────

	test("Should return ORDER_NOT_FOUND when the order does not exist", async () => {
		await runTestInTransaction(async (tx) => {
			const result = await getOrderDetailsHandler({
				query: {
					workspaceId: "01H8X5Y9Z0123456789ABCDEFX",
					orderId: "01H8X5Y9Z0123456789ABCDEFW",
				},
				orderRepository: OrderDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("ORDER_NOT_FOUND");
		});
	});

	test("Should return ORDER_NOT_FOUND when the order belongs to another workspace", async () => {
		await runTestInTransaction(async (tx) => {
			const base = await seedBase(tx);
			const orderId = await seedOrder(tx, base);
			const otherWorkspaceId = await seedWorkspace(tx);

			const result = await getOrderDetailsHandler({
				query: { workspaceId: otherWorkspaceId, orderId },
				orderRepository: OrderDrizzleRepository(tx),
				userRepository: userDrizzleRepository(tx),
			});

			expect(result.isFailure).toBe(true);
			expect(result.error.code).toBe("ORDER_NOT_FOUND");
		});
	});
});

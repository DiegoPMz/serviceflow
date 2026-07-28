import { describe, expect, test } from "bun:test";
import { Folio, Order } from "./order.model";

const ULID_REGEX = /^[0-9A-Z]{26}$/;

const validFolio = () =>
	Folio.create({
		workspaceOrderCount: 0,
		workspacePrefix: "TEST",
	}).value;

const validOrderData = (overrides: Record<string, unknown> = {}) => ({
	clientId: "client-1",
	deviceId: "device-1",
	userId: "user-1",
	workspaceId: "ws-1",
	observations: "Pantalla rota",
	folio: validFolio(),
	clientNameSnapshot: "Client Name",
	clientEmailSnapshot: "client@example.com",
	clientPhoneSnapshot: "+5215551234567",
	clientLocationSnapshot: "CDMX",
	deviceBrandSnapshot: "Samsung",
	deviceModelSnapshot: "Galaxy S21",
	deviceSerialNumberSnapshot: "SN-1",
	userNameSnapshot: "David",
	...overrides,
});

describe("Folio.create", () => {
	test("Should build value as prefix + (orderCount + 1) when count is 0", () => {
		const result = Folio.create({
			workspaceOrderCount: 0,
			workspacePrefix: "TEST",
		});
		expect(result.isSuccess).toBe(true);
		expect(result.value.value).toBe("TEST1");
	});

	test("Should build value as prefix + (orderCount + 1) for a positive count", () => {
		const result = Folio.create({
			workspaceOrderCount: 4,
			workspacePrefix: "WF",
		});
		expect(result.isSuccess).toBe(true);
		expect(result.value.value).toBe("WF5");
	});

	test("Should return FOLIO_WORKSPACE_ORDER_COUNT_NAN when count is NaN", () => {
		const result = Folio.create({
			workspaceOrderCount: Number.NaN,
			workspacePrefix: "TEST",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("FOLIO_WORKSPACE_ORDER_COUNT_NAN");
	});

	test("Should return FOLIO_WORKSPACE_ORDER_COUNT_NEGATIVE when count is negative", () => {
		const result = Folio.create({
			workspaceOrderCount: -1,
			workspacePrefix: "TEST",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("FOLIO_WORKSPACE_ORDER_COUNT_NEGATIVE");
	});

	test("Should return FOLIO_WORKSPACE_PREFIX_REQUIRED when prefix is empty", () => {
		const result = Folio.create({
			workspaceOrderCount: 0,
			workspacePrefix: "",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("FOLIO_WORKSPACE_PREFIX_REQUIRED");
	});
});

describe("Order.create", () => {
	test("Should create a valid order with snapshots and empty components", () => {
		const result = Order.create(validOrderData());

		expect(result.isSuccess).toBe(true);
		const order = result.value;
		expect(ULID_REGEX.test(order.id)).toBe(true);
		expect(order.folio).toBe("TEST1");
		expect(order.clientId).toBe("client-1");
		expect(order.deviceId).toBe("device-1");
		expect(order.userId).toBe("user-1");
		expect(order.workspaceId).toBe("ws-1");
		expect(order.observations).toBe("Pantalla rota");
		expect(order.clientNameSnapshot).toBe("Client Name");
		expect(order.clientEmailSnapshot).toBe("client@example.com");
		expect(order.clientPhoneSnapshot).toBe("+5215551234567");
		expect(order.clientLocationSnapshot).toBe("CDMX");
		expect(order.deviceBrandSnapshot).toBe("Samsung");
		expect(order.deviceModelSnapshot).toBe("Galaxy S21");
		expect(order.deviceSerialNumberSnapshot).toBe("SN-1");
		expect(order.documentKey).toBeNull();
		expect(order.orderComponents.length).toBe(0);
		expect(order.createdAt).toBeInstanceOf(Date);
		expect(order.updatedAt).toBeInstanceOf(Date);
	});

	test("Should return ORDER_CLIENT_ID_REQUIRED for empty clientId", () => {
		const result = Order.create(validOrderData({ clientId: "" }));
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_CLIENT_ID_REQUIRED");
	});

	test("Should return ORDER_CLIENT_ID_REQUIRED for whitespace-only clientId", () => {
		const result = Order.create(validOrderData({ clientId: "   " }));
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_CLIENT_ID_REQUIRED");
	});

	test("Should return ORDER_ISSUE_OBSERVATION_REQUIRED for empty observations", () => {
		const result = Order.create(validOrderData({ observations: "" }));
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_ISSUE_OBSERVATION_REQUIRED");
	});

	test("Should return ORDER_ISSUE_OBSERVATION_TOO_LONG when observations exceed 1000 chars", () => {
		const result = Order.create(
			validOrderData({ observations: "x".repeat(1001) }),
		);
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_ISSUE_OBSERVATION_TOO_LONG");
	});

	test("Should succeed when observations are exactly 1000 chars", () => {
		const result = Order.create(
			validOrderData({ observations: "x".repeat(1000) }),
		);
		expect(result.isSuccess).toBe(true);
	});

	test("Should return ORDER_WORKSPACE_ID_REQUIRED for empty workspaceId", () => {
		const result = Order.create(validOrderData({ workspaceId: "" }));
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_WORKSPACE_ID_REQUIRED");
	});

	test("Should return ORDER_USER_ID_REQUIRED for empty userId", () => {
		const result = Order.create(validOrderData({ userId: "" }));
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_USER_ID_REQUIRED");
	});

	test("Should return ORDER_FOLIO_INVALID when folio is not a Folio instance", () => {
		const result = Order.create(
			validOrderData({ folio: { value: "TEST1" } as never }),
		);
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_FOLIO_INVALID");
	});

	test("Should return ORDER_FOLIO_INVALID when folio value is empty", () => {
		const emptyFolio = Folio.create({
			workspaceOrderCount: 0,
			workspacePrefix: "",
		});
		expect(emptyFolio.isFailure).toBe(true);
		const result = Order.create(validOrderData({ folio: emptyFolio.value }));
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_FOLIO_INVALID");
	});
});

describe("Order.addComponent", () => {
	const createdOrder = () => Order.create(validOrderData()).value;

	test("Should add a valid component to the order", () => {
		const order = createdOrder();
		const result = order.addComponent({
			deviceComponentId: "dc-1",
			name: "Batería",
			quantity: 2,
			partNumber: "BAT-001",
			type: "supply",
		});

		expect(result.isSuccess).toBe(true);
		expect(order.orderComponents.length).toBe(1);
		expect(order.orderComponents[0]?.componentNameSnapshot).toBe("Batería");
		expect(order.orderComponents[0]?.quantity).toBe(2);
		expect(order.orderComponents[0]?.deviceComponentId).toBe("dc-1");
	});

	test("Should add multiple components", () => {
		const order = createdOrder();
		order.addComponent({
			deviceComponentId: "dc-1",
			name: "Batería",
			quantity: 1,
			partNumber: "BAT-001",
			type: "supply",
		});
		order.addComponent({
			deviceComponentId: "dc-2",
			name: "Pantalla",
			quantity: 1,
			partNumber: "SCR-001",
			type: "replacement_part",
		});

		expect(order.orderComponents.length).toBe(2);
	});

	test("Should return ORDER_COMPONENT_DEVICE_COMPONENT_ID_REQUIRED for empty id", () => {
		const result = createdOrder().addComponent({
			deviceComponentId: "",
			name: "Batería",
			quantity: 1,
			partNumber: "BAT-001",
			type: "supply",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			"ORDER_COMPONENT_DEVICE_COMPONENT_ID_REQUIRED",
		);
	});

	test("Should return ORDER_COMPONENT_NAME_REQUIRED for empty name", () => {
		const result = createdOrder().addComponent({
			deviceComponentId: "dc-1",
			name: "",
			quantity: 1,
			partNumber: "BAT-001",
			type: "supply",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_COMPONENT_NAME_REQUIRED");
	});

	test("Should return ORDER_COMPONENT_QUANTITY_INVALID for zero quantity", () => {
		const result = createdOrder().addComponent({
			deviceComponentId: "dc-1",
			name: "Batería",
			quantity: 0,
			partNumber: "BAT-001",
			type: "supply",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_COMPONENT_QUANTITY_INVALID");
	});

	test("Should return ORDER_COMPONENT_QUANTITY_INVALID for negative quantity", () => {
		const result = createdOrder().addComponent({
			deviceComponentId: "dc-1",
			name: "Batería",
			quantity: -3,
			partNumber: "BAT-001",
			type: "supply",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_COMPONENT_QUANTITY_INVALID");
	});

	test("Should return ORDER_COMPONENT_QUANTITY_INVALID for non-integer quantity", () => {
		const result = createdOrder().addComponent({
			deviceComponentId: "dc-1",
			name: "Batería",
			quantity: 1.5,
			partNumber: "BAT-001",
			type: "supply",
		});
		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe("ORDER_COMPONENT_QUANTITY_INVALID");
	});

	test("Should return a cloned array from orderComponents that does not leak mutations", () => {
		const order = createdOrder();
		order.addComponent({
			deviceComponentId: "dc-1",
			name: "Batería",
			quantity: 1,
			partNumber: "BAT-001",
			type: "supply",
		});

		const firstRead = order.orderComponents;
		(firstRead as unknown[]).push("extra");

		expect(order.orderComponents.length).toBe(1);
	});
});

describe("Order.attachDocumentKey", () => {
	test("Should set the document key and return success", () => {
		const order = Order.create(validOrderData()).value;
		const result = order.attachDocumentKey("https://example.com/order.pdf");

		expect(result.isSuccess).toBe(true);
		expect(order.documentKey).toBe("https://example.com/order.pdf");
	});
});

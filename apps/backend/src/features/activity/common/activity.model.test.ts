import { describe, expect, test } from "bun:test";
import { ACTIVITY_ERROR_CODES } from "@serviceflow/error-codes";
import { ulid } from "ulidx";
import { WorkspaceActivity } from "./activity.model";

const workspaceId = ulid();
const actor = { userId: ulid(), name: "Ana Rodríguez" };

describe("WorkspaceActivity Model Tests", () => {
	test("Should create an order-created activity without metadata", () => {
		const result = WorkspaceActivity.orderCreated({
			workspaceId,
			actor,
			orderId: ulid(),
			folio: "OS-000125",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.type).toBe("ORDER_CREATED");
		expect(result.value.entityLabel).toBe("OS-000125");
		expect(result.value.actorNameSnapshot).toBe(actor.name);
		expect(result.value.metadata).toBeNull();
		expect(result.value.createdAt).toBeInstanceOf(Date);
	});

	test("Should create an order status change activity with previous and new status", () => {
		const result = WorkspaceActivity.orderStatusChanged({
			workspaceId,
			actor,
			orderId: ulid(),
			folio: "OS-000125",
			previousStatus: "pendiente",
			newStatus: "entregada",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.type).toBe("ORDER_STATUS_CHANGED");
		expect(result.value.metadata).toEqual({
			previousStatus: "pendiente",
			newStatus: "entregada",
		});
	});

	test("Should fail when previous and new status are the same", () => {
		const result = WorkspaceActivity.orderStatusChanged({
			workspaceId,
			actor,
			orderId: ulid(),
			folio: "OS-000125",
			previousStatus: "entregada",
			newStatus: "entregada",
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ACTIVITY_ERROR_CODES.STATUS_UNCHANGED);
	});

	test("Should create a client-created activity", () => {
		const result = WorkspaceActivity.clientCreated({
			workspaceId,
			actor,
			clientId: ulid(),
			clientName: "Empresa ABC",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.type).toBe("CLIENT_CREATED");
		expect(result.value.entityLabel).toBe("Empresa ABC");
	});

	test("Should create a device-registered activity", () => {
		const result = WorkspaceActivity.deviceRegistered({
			workspaceId,
			actor,
			deviceId: ulid(),
			deviceFullName: "HP LaserJet Pro M404dn",
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.type).toBe("DEVICE_REGISTERED");
		expect(result.value.entityLabel).toBe("HP LaserJet Pro M404dn");
	});

	test("Should create a consumables-registered activity with a count", () => {
		const result = WorkspaceActivity.consumablesRegistered({
			workspaceId,
			actor,
			deviceId: ulid(),
			deviceFullName: "HP LaserJet Pro M404dn",
			count: 3,
		});

		expect(result.isSuccess).toBe(true);
		expect(result.value.type).toBe("CONSUMABLE_REGISTERED");
		expect(result.value.metadata).toEqual({ count: 3 });
	});

	test("Should fail when the consumables count is not a positive integer", () => {
		const result = WorkspaceActivity.consumablesRegistered({
			workspaceId,
			actor,
			deviceId: ulid(),
			deviceFullName: "HP LaserJet Pro M404dn",
			count: 0,
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(
			ACTIVITY_ERROR_CODES.CONSUMABLE_COUNT_INVALID,
		);
	});

	test("Should fail when the workspace id is missing", () => {
		const result = WorkspaceActivity.orderCreated({
			workspaceId: " ",
			actor,
			orderId: ulid(),
			folio: "OS-000125",
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ACTIVITY_ERROR_CODES.WORKSPACE_ID_REQUIRED);
	});

	test("Should fail when the actor id is missing", () => {
		const result = WorkspaceActivity.orderCreated({
			workspaceId,
			actor: { userId: "", name: "Ana Rodríguez" },
			orderId: ulid(),
			folio: "OS-000125",
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ACTIVITY_ERROR_CODES.ACTOR_ID_REQUIRED);
	});

	test("Should fail when the actor name is missing", () => {
		const result = WorkspaceActivity.orderCreated({
			workspaceId,
			actor: { userId: ulid(), name: " " },
			orderId: ulid(),
			folio: "OS-000125",
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ACTIVITY_ERROR_CODES.ACTOR_NAME_REQUIRED);
	});

	test("Should fail when the entity label is missing", () => {
		const result = WorkspaceActivity.orderCreated({
			workspaceId,
			actor,
			orderId: ulid(),
			folio: "",
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ACTIVITY_ERROR_CODES.ENTITY_LABEL_REQUIRED);
	});

	test("Should fail when the activity type is not supported", () => {
		const result = WorkspaceActivity.create({
			workspaceId,
			actor,
			type: "WORKSPACE_UPDATED" as never,
			entityId: null,
			entityLabel: "Espacio de trabajo",
			metadata: null,
		});

		expect(result.isFailure).toBe(true);
		expect(result.error.code).toBe(ACTIVITY_ERROR_CODES.TYPE_INVALID);
	});
});

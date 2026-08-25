/** biome-ignore-all lint/suspicious/noExplicitAny: <testing porpuses> */
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	mock,
	test,
} from "bun:test";
import { workspaceMemberErrors } from "@serviceflow/backend/features/workspace/common/workspace-member.errors";
import {
	WORKSPACE_ROLES,
	WORKSPACE_ROLES_ARRAY,
} from "@serviceflow/backend/features/workspace/common/workspace-member.model";
import Elysia from "elysia";
import { ulid } from "ulidx";
import { Result } from "../result";
import { realtimeRouter } from "./realtime.routes";

describe("Realtime Router WebSocket Integration Tests", () => {
	let app: Elysia;
	let baseUrl: string;

	const mockExecute = mock((role?: string) =>
		Promise.resolve(Result.success({ role: role ?? WORKSPACE_ROLES.ADMIN })),
	);
	const mockWorkspaceAuthorization = {
		excecute: mockExecute,
	};

	const mockAuthUserId = ulid();
	const mockAuthPlugin = new Elysia({ name: "auth-plugin" }).macro(
		"auth",
		() => ({
			resolve: () => ({
				auth: {
					userId: mockAuthUserId,
				},
			}),
		}),
	);

	beforeAll(() => {
		app = new Elysia()
			.use(
				realtimeRouter(mockAuthPlugin as any, {
					workspaceAuthorization: mockWorkspaceAuthorization as any,
				}),
			)
			.listen(0) as unknown as Elysia;

		baseUrl = `ws://${app.server?.hostname}:${app.server?.port}`;
	});

	afterAll(() => {
		app.stop();
	});

	beforeEach(() => {
		mockExecute.mockClear();
	});

	test("should open connection and execute authorization check with correct parameters when workspace authorization succeeds", async () => {
		const workspaceId = ulid();

		const wsUrl = `${baseUrl}/v1/realtime/workspaces/${workspaceId}`;
		const ws = new WebSocket(wsUrl);

		const isOpen = await new Promise<boolean>((resolve) => {
			ws.onopen = () => resolve(true);
			ws.onerror = (err) => {
				console.error("WS Error:", err);
				resolve(false);
			};
		});

		expect(isOpen).toBe(true);
		expect(mockExecute).toHaveBeenCalledWith({
			workspaceId,
			userId: mockAuthUserId,
			requiredRoles: WORKSPACE_ROLES_ARRAY,
		});

		ws.close();
	});

	test("should reject connection when workspace authorization fails", async () => {
		const workspaceId = ulid();
		mockExecute.mockResolvedValueOnce(
			Result.failure(workspaceMemberErrors.NOT_A_MEMBER),
		);

		const wsUrl = `${baseUrl}/v1/realtime/workspaces/${workspaceId}`;
		const ws = new WebSocket(wsUrl);

		const isError = await new Promise<boolean>((resolve) => {
			ws.onerror = () => resolve(true);
			ws.onopen = () => resolve(false);
		});

		expect(isError).toBe(true);
		expect(ws.readyState).toBe(WebSocket.CLOSED);
	});

	test("should reject connection via TypeBox schema validation before executing authorization check when workspaceId param is missing", async () => {
		mockExecute.mockClear();

		const wsUrl = `${baseUrl}/v1/realtime/workspaces`;
		const ws = new WebSocket(wsUrl);

		const isError = await new Promise<boolean>((resolve) => {
			ws.onerror = () => resolve(true);
			ws.onopen = () => resolve(false);
		});

		expect(isError).toBe(true);
		expect(mockExecute).not.toHaveBeenCalled();
	});

	test("should receive published events on subscribed workspace topic when message is broadcasted from server", async () => {
		const workspaceId = ulid();
		const orderId = ulid();
		mockExecute.mockResolvedValueOnce(
			Result.success({ role: WORKSPACE_ROLES.ADMIN }),
		);

		const wsUrl = `${baseUrl}/v1/realtime/workspaces/${workspaceId}`;
		const ws = new WebSocket(wsUrl);

		await new Promise((resolve) => (ws.onopen = resolve));

		const messagePromise = new Promise<{
			event: string;
			data: { orderId: string };
		}>((resolve) => {
			ws.onmessage = (event) => {
				resolve(JSON.parse(event.data));
			};
		});

		const payload = { event: "ORDER_CREATED", data: { orderId } };
		app.server?.publish(`workspace:${workspaceId}`, JSON.stringify(payload));

		const receivedMessage = await messagePromise;

		expect(receivedMessage.event).toBe("ORDER_CREATED");
		expect(receivedMessage.data).toEqual({ orderId });

		ws.close();
	});
});

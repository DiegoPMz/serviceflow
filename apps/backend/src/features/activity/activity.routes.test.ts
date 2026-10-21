/** biome-ignore-all lint/suspicious/noExplicitAny: <Just for testing porpuses> */

import { beforeEach, describe, expect, mock, test } from "bun:test";
import { Result } from "@serviceflow/backend/shared/result";
import Elysia from "elysia";
import { ulid } from "ulidx";
import { workspaceMemberErrors } from "../workspace/common/workspace-member.errors";
import {
	WORKSPACE_ROLES,
	type WorkspaceMember,
} from "../workspace/common/workspace-member.model";
import { ActivityReadModel } from "./common/activity.read-model";
import { type ActivityDependencies, activityRoutes } from "./index";

const mockUserId = "01H8X5Y9Z0123456789ABCDEF1";
const validWorkspaceId = ulid();

const mockAuthPlugin = new Elysia({ name: "mock-auth" }).derive(
	{ as: "global" },
	() => ({
		auth: {
			userId: mockUserId,
		},
	}),
);

const validActivity = ActivityReadModel.create({
	id: ulid(),
	type: "ORDER_CREATED",
	actorNameSnapshot: "Ana Rodríguez",
	entityLabel: "OS-000125",
	metadata: null,
	createdAt: new Date("2026-01-01T10:00:00Z"),
});

describe("Activity HTTP Routes - Unit Tests", () => {
	let mockDeps: ActivityDependencies;

	beforeEach(() => {
		mock.restore();

		mockDeps = {
			activityRepository: {
				save: mock(() => Promise.resolve()),
				getRecentByWorkspace: mock(() => Promise.resolve([validActivity])),
			} as any,
			workspaceAuthorization: {
				excecute: mock(() => Promise.resolve(Result.success(true))),
			} as any,
		};
	});

	const createTestApp = () =>
		new Elysia().use(activityRoutes(mockAuthPlugin as any, mockDeps));

	describe("GET /v1/workspaces/:workspaceId/activities", () => {
		test("should return 422 when the workspaceId param is invalid", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request("http://localhost/v1/workspaces/invalid-id/activities", {
					method: "GET",
				}),
			);

			expect(response.status).toBe(422);
		});

		test("should return 422 when the limit is out of range", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/activities?limit=500`,
					{
						method: "GET",
					},
				),
			);

			expect(response.status).toBe(422);
		});

		test("should return 403 if the user is not a member of the workspace", async () => {
			mockDeps.workspaceAuthorization.excecute = mock(() =>
				Promise.resolve(
					Result.failure<WorkspaceMember>(workspaceMemberErrors.NOT_A_MEMBER),
				),
			);

			const app = createTestApp();
			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/activities`,
					{
						method: "GET",
					},
				),
			);

			expect(mockDeps.workspaceAuthorization.excecute).toHaveBeenCalledWith({
				workspaceId: validWorkspaceId,
				userId: mockUserId,
				requiredRoles: [
					WORKSPACE_ROLES.OWNER,
					WORKSPACE_ROLES.ADMIN,
					WORKSPACE_ROLES.TECHNICIAN,
					WORKSPACE_ROLES.VIEWER,
				],
			});

			expect(response.status).toBe(
				workspaceMemberErrors.NOT_A_MEMBER.statusCode,
			);
		});

		test("should return 200 with the recent activities using the default limit", async () => {
			const app = createTestApp();

			const response = await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/activities`,
					{
						method: "GET",
					},
				),
			);

			expect(response.status).toBe(200);

			expect(
				mockDeps.activityRepository.getRecentByWorkspace,
			).toHaveBeenCalledWith({
				workspaceId: validWorkspaceId,
				limit: 4,
			});

			const body = await response.json();
			expect(body).toEqual([
				{
					id: validActivity.id,
					type: "ORDER_CREATED",
					actorName: "Ana Rodríguez",
					entityLabel: "OS-000125",
					metadata: null,
					occurredAt: "2026-01-01T10:00:00.000Z",
				},
			]);
		});

		test("should forward the requested limit to the repository", async () => {
			const app = createTestApp();

			await app.handle(
				new Request(
					`http://localhost/v1/workspaces/${validWorkspaceId}/activities?limit=10`,
					{
						method: "GET",
					},
				),
			);

			expect(
				mockDeps.activityRepository.getRecentByWorkspace,
			).toHaveBeenCalledWith({
				workspaceId: validWorkspaceId,
				limit: 10,
			});
		});
	});
});

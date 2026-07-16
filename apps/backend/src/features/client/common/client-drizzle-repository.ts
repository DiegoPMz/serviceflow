import {
	clients,
	type DatabaseClient,
} from "@serviceflow/backend/shared/database";
import type { Client } from "./client.model";
import type { ClientRepository } from "./client-repository";

export const clientDrizzleRepository = (
	db: DatabaseClient,
): ClientRepository => ({
	clientExists: async (values: {
		email: string;
		phone: string;
	}): Promise<boolean> => {
		const clientId = await db.query.clients.findFirst({
			where: (clients, { eq, or }) =>
				or(
					eq(clients.email, values.email),
					eq(clients.phoneNumber, values.phone),
				),
			columns: { id: true },
		});

		return !!clientId;
	},

	save: async (model: Client): Promise<void> => {
		await db.insert(clients).values({
			id: model.id,
			email: model.email,
			location: model.location,
			name: model.name,
			phoneNumber: model.phoneNumber,
			workspaceId: model.workspaceId,
			createdAt: model.createdAt,
			updatedAt: model.updatedAt,
		});
	},

	getByIds: async (
		clientId: string,
		workspaceId: string,
	): Promise<Client | null> => {
		const entity = await db.query.clients.findFirst({
			where: (clients, { eq, and }) =>
				and(eq(clients.id, clientId), eq(clients.workspaceId, workspaceId)),
		});

		if (!entity) return null;

		return {
			id: entity.id,
			email: entity.email,
			location: entity.location,
			name: entity.name,
			phoneNumber: entity.phoneNumber,
			workspaceId: entity.workspaceId,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	},
});

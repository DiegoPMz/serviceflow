import type { Client } from "./client.model";

export interface ClientRepository {
	clientExists: (data: { email: string; phone: string }) => Promise<boolean>;
	save: (model: Client) => Promise<void>;
	getByIds: (clientId: string, workspaceId: string) => Promise<Client | null>;
}

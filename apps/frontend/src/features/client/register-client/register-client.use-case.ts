import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";
import type { RegisterClientInput } from "./register-client.schema";

export interface RegisterClientUseCaseInput {
	workspaceId: string;
	clientData: RegisterClientInput;
	eden: Eden;
}

export interface RegisterClientUseCaseResult {
	clientId: string;
}

export async function registerClient({
	workspaceId,
	clientData,
	eden,
}: RegisterClientUseCaseInput): Promise<RegisterClientUseCaseResult> {
	const { data, error } = await eden.v1
		.workspaces({ workspaceId })
		.clients.post({
			name: clientData.name,
			email: clientData.email,
			phoneNumber: clientData.phoneNumber,
			location: clientData.location,
		});

	if (error) {
		normalizeEdenError(error);
	}

	if (!data?.clientId) {
		throw new Error("No se recibió el ID del cliente registrado.");
	}

	return { clientId: data.clientId };
}

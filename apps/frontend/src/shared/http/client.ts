import { treaty } from "@elysia/eden/treaty2";
import type { App as Server } from "@serviceflow/backend/index";
import { apiConfig } from "../config/env";

const eden = treaty<Server>(apiConfig.url);

interface CreateEdenProps {
	getToken: () => Promise<string | null>;
}

export const createEden = ({
	getToken,
}: CreateEdenProps): Eden =>
	treaty<Server>(apiConfig.url, {
		onRequest: async (_, options) => {
			options.headers = options.headers || {};
			const token = await getToken();

			if (token) {
				(options.headers as Record<string, string>)["Authorization"] =
					`Bearer ${token}`;
			}
		},
	});

export type Eden = typeof eden;

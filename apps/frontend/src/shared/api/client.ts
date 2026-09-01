import { treaty } from "@elysia/eden/treaty2";
import type { App as BackendTypes } from "@serviceflow/backend";

type ApiClient = ReturnType<typeof treaty<BackendTypes>>;

export const api: ApiClient = treaty<BackendTypes>(
	import.meta.env.VITE_API_URL ?? "",
);

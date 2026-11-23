import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import Elysia from "elysia";
import type { UserRepository } from "./common/user-repository";
import { getProfileHandler } from "./get-profile";

export interface UserDependencies {
	userRepository: UserRepository;
}

export const userRoutes = (
	auth: AuthPlugin,
	{ userRepository }: UserDependencies,
) =>
	new Elysia({ prefix: "/v1" })
		// =========================================================================
		// 1. GET /v1/users/me
		// =========================================================================
		.use(
			new Elysia({ prefix: "/users" }).use(auth).get(
				"/me",
				async ({ auth, status }) => {
					const result = await getProfileHandler({
						query: { userId: auth.userId },
						repository: userRepository,
					});

					if (result.isFailure) {
						return status(result.error.statusCode, { ...result.error });
					}

					return status(200, result.value);
				},
				{
					auth: true,
				},
			),
		);

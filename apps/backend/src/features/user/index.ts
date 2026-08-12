import type { ApiResponse } from "@serviceflow/backend/shared/http/api-response";
import type { AuthPlugin } from "@serviceflow/backend/shared/http/auth-plugin";
import { respond } from "@serviceflow/backend/shared/http/respond";
import Elysia from "elysia";
import type { UserDto } from "./common/user.dto";
import type { UserRepository } from "./common/user-repository";
import { getProfileHandler } from "./get-profile";

export interface UserDependencies {
	userRepository: UserRepository;
}

export const userRoutes = (
	auth: AuthPlugin,
	{ userRepository }: UserDependencies,
) =>
	new Elysia({ prefix: "/v1/users" }).use(auth).get(
		"/me",
		async ({ auth, set }): Promise<ApiResponse<UserDto>> => {
			const result = await getProfileHandler({
				query: { userId: auth.userId },
				repository: userRepository,
			});

			if (result.isFailure) {
				return respond.failure(result.error, set);
			}

			return respond.success(result.value, set);
		},
		{
			auth: true,
		},
	);

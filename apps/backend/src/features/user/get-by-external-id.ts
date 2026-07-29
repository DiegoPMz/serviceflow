import type { UserRepository } from "./common/user-repository";

export class GetUserByExternalIdQuery {
	public constructor(
		public readonly value: {
			readonly externalId: string;
		},
	) {}
}

interface GetUserByExternalIdHandlerProps {
	query: GetUserByExternalIdQuery["value"];
	repository: UserRepository;
}

export const getUserByExternalIdHandler = ({
	query,
	repository,
}: GetUserByExternalIdHandlerProps) =>
	repository.getByExternalId(query.externalId);

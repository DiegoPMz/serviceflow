import type { Transactional } from "@serviceflow/backend/shared/database";
import type { User } from "./user.model";

export interface UserRepository extends Transactional<UserRepository> {
	save: (user: User) => Promise<void>;
	getById: (id: string) => Promise<User | null>;
	getByExternalId(externalId: string): Promise<User | null>;
	getPictureUrlById: (id: string) => Promise<string | null>;
}

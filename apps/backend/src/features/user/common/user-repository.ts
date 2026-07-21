import type { User } from "./user.model";

export interface UserRepository {
	save: (user: User) => Promise<void>;
	getById: (id: string) => Promise<User | null>;
}

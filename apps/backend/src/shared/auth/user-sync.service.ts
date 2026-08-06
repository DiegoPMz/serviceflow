import type { User } from "@serviceflow/backend/features/user/common/user.model";
import type { Result } from "../result";

export interface UserSyncService {
	ensureUserSynced(externalId: string): Promise<Result<User>>;
}

import { toast } from "sonner";
import { ApiError } from "@/shared/lib/api-error";

export function notifyTeamError(error: unknown, title: string) {
	toast.error(title, {
		description: error instanceof ApiError ? error.message : undefined,
	});
}

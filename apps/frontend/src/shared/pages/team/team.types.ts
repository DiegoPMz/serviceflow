import type { WorkspaceInvitationListItem } from "@/features/workpace/paginated-workspace-invitations";
import type { WorkspaceMemberListItem } from "@/features/workpace/paginated-workspace-members";

export type TeamTab = "members" | "invitations";

export interface PaginatedListState {
	isPending: boolean;
	isError: boolean;
	/** Fallo al revalidar con datos ya visibles en pantalla. */
	isRefetchError: boolean;
	/** Fallo al solicitar la siguiente página. */
	isFetchNextPageError: boolean;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
	onLoadMore: () => void;
	refetch: () => void;
}

export interface TeamMembersState {
	items: WorkspaceMemberListItem[];
	search: string;
	onSearchChange: (value: string) => void;
	query: PaginatedListState;
}

export interface TeamInvitationsState {
	items: WorkspaceInvitationListItem[];
	resendingEmail: string | null;
	onResend: (invitation: WorkspaceInvitationListItem) => void;
	query: PaginatedListState;
}

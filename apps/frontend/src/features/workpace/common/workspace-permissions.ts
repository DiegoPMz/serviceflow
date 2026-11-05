type WorkspaceRole = "owner" | "admin" | "technician" | "viewer";

export type WorkspacePermissions = {
	canCreateOrders: boolean;
	canCreateClients: boolean;
	canChangeOrderStatus: boolean;
	canInviteMembers: boolean;
};

export function getWorkspacePermissions(
	role: WorkspaceRole,
): WorkspacePermissions {
	switch (role) {
		case "owner":
		case "admin":
			return {
				canCreateOrders: true,
				canCreateClients: true,
				canChangeOrderStatus: true,
				canInviteMembers: true,
			};

		case "technician":
			return {
				canCreateOrders: true,
				canCreateClients: true,
				canChangeOrderStatus: true,
				canInviteMembers: false,
			};

		case "viewer":
			return {
				canCreateOrders: false,
				canCreateClients: false,
				canChangeOrderStatus: false,
				canInviteMembers: false,
			};
	}
}

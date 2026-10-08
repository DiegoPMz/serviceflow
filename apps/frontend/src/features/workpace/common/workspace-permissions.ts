type WorkspaceRole = "owner" | "admin" | "technician" | "viewer";

type WorkspacePermissions = {
	canCreateOrders: boolean;
	canCreateClients: boolean;
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
				canInviteMembers: true,
			};

		case "technician":
			return {
				canCreateOrders: true,
				canCreateClients: true,
				canInviteMembers: false,
			};

		case "viewer":
			return {
				canCreateOrders: false,
				canCreateClients: false,
				canInviteMembers: false,
			};
	}
}

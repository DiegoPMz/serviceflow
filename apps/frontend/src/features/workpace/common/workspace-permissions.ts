import type { WorkspaceRole } from "./workspace-role";

export type WorkspacePermissions = {
	canCreateOrders: boolean;
	canCreateClients: boolean;
	canChangeOrderStatus: boolean;
	canInviteMembers: boolean;
	canManageTeam: boolean;
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
				canManageTeam: true,
			};

		case "technician":
			return {
				canCreateOrders: true,
				canCreateClients: true,
				canChangeOrderStatus: true,
				canInviteMembers: false,
				canManageTeam: false,
			};

		case "viewer":
			return {
				canCreateOrders: false,
				canCreateClients: false,
				canChangeOrderStatus: false,
				canInviteMembers: false,
				canManageTeam: false,
			};
	}
}

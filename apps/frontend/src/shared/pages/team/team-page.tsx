import { Lock, Mail, Users } from "lucide-react";
import { useState } from "react";
import { getTeamPolicy } from "@/features/workpace/common/team-permissions";
import { useGetWorkspaceSummary } from "@/features/workpace/get-workspace-summary";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/shared/components/ui/tabs";
import type { Eden } from "@/shared/http/client";
import { InvitationsSection } from "./components/invitations-section";
import { MembersSection } from "./components/members-section";
import { ChangeRoleDialog } from "./dialogs/change-role-dialog";
import { InviteMemberDialog } from "./dialogs/invite-member-dialog";
import { RemoveMemberDialog } from "./dialogs/remove-member-dialog";
import { RevokeInvitationDialog } from "./dialogs/revoke-invitation-dialog";
import type { TeamTab } from "./team.types";
import { useTeamDialog } from "./use-team-dialog.hook";
import { useTeamInvitations } from "./use-team-invitations.hook";
import { useTeamMembers } from "./use-team-members.hook";

export interface TeamPageProps {
	workspaceId: string;
	eden: Eden;
}

export function TeamPage({ workspaceId, eden }: TeamPageProps) {
	const { data } = useGetWorkspaceSummary(eden, { workspaceId });
	const policy = getTeamPolicy(data.userRole);

	const [requestedTab, setRequestedTab] = useState<TeamTab>("members");
	const tab: TeamTab = policy.canManageTeam ? requestedTab : "members";

	const { dialog, openDialog, closeDialog } = useTeamDialog();

	const members = useTeamMembers({ eden, workspaceId });
	const invitations = useTeamInvitations({
		eden,
		workspaceId,
		enabled: policy.canManageTeam && tab === "invitations",
	});

	return (
		<main className="px-4 py-6 sm:px-6 lg:px-8">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="font-mono text-[11px] uppercase tracking-widest text-primary">
						Administración · {data.name}
					</p>
					<h1 className="mt-1 font-display text-3xl font-bold tracking-tight lg:text-4xl">
						Equipo
					</h1>
					<p className="mt-1.5 text-sm text-muted-foreground">
						Administra las personas que forman parte de tu espacio de trabajo.
					</p>
				</div>
			</header>

			<Tabs
				value={tab}
				onValueChange={(value) => setRequestedTab(value as TeamTab)}
				className="my-4"
			>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<TabsList>
						<TabsTrigger value="members">
							<Users className="size-4 text-muted-foreground" />
							Miembros
						</TabsTrigger>

						{policy.canManageTeam && (
							<TabsTrigger value="invitations">
								<Mail className="size-4 text-muted-foreground" />
								Invitaciones
							</TabsTrigger>
						)}
					</TabsList>

					{!policy.canManageTeam && (
						<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<Lock className="size-3.5 text-muted-foreground" />
							Modo lectura · Solo consulta de integrantes
						</p>
					)}
				</div>

				<TabsContent value="members">
					<MembersSection
						members={members}
						canManage={policy.canManage}
						onChangeRole={(member) =>
							openDialog({ type: "changeRole", member })
						}
						onRemove={(member) => openDialog({ type: "removeMember", member })}
					/>
				</TabsContent>

				{policy.canManageTeam && (
					<TabsContent value="invitations">
						<InvitationsSection
							invitations={invitations}
							onInvite={() => openDialog({ type: "invite" })}
							onRevoke={(invitation) =>
								openDialog({ type: "revokeInvitation", invitation })
							}
						/>
					</TabsContent>
				)}
			</Tabs>

			{dialog?.type === "changeRole" && (
				<ChangeRoleDialog
					eden={eden}
					workspaceId={workspaceId}
					member={dialog.member}
					options={policy.invitableRoles}
					onClose={closeDialog}
				/>
			)}

			{dialog?.type === "removeMember" && (
				<RemoveMemberDialog
					eden={eden}
					workspaceId={workspaceId}
					member={dialog.member}
					workspaceName={data.name}
					onClose={closeDialog}
				/>
			)}

			{dialog?.type === "revokeInvitation" && (
				<RevokeInvitationDialog
					eden={eden}
					workspaceId={workspaceId}
					invitation={dialog.invitation}
					onClose={closeDialog}
				/>
			)}

			{dialog?.type === "invite" && policy.canManageTeam && (
				<InviteMemberDialog
					eden={eden}
					workspaceId={workspaceId}
					availableRoles={policy.invitableRoles}
					onClose={closeDialog}
				/>
			)}
		</main>
	);
}

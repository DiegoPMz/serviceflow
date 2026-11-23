import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useChangeWorkspaceMemberRole } from "@/features/workpace/change-workspace-member-role";
import type { AssignableWorkspaceRole } from "@/features/workpace/common/workspace-role";
import { WORKSPACE_ROLE_LABELS } from "@/features/workpace/common/workspace-role";
import type { WorkspaceMemberListItem } from "@/features/workpace/paginated-workspace-members";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from "@/shared/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import type { Eden } from "@/shared/http/client";
import { getInitials } from "@/shared/lib/get-initials";
import { RoleBadge } from "../components/team-role-badge";
import { ROLE_DESCRIPTIONS } from "../team.constants";
import { formatMemberName } from "../team.presentation";

interface ChangeRoleDialogProps {
	eden: Eden;
	workspaceId: string;
	member: WorkspaceMemberListItem;
	/** Roles que el usuario actual puede asignar, ya filtrados por la política. */
	options: readonly AssignableWorkspaceRole[];
	onClose: () => void;
}

export function ChangeRoleDialog({
	eden,
	workspaceId,
	member,
	options,
	onClose,
}: ChangeRoleDialogProps) {
	const changeRole = useChangeWorkspaceMemberRole();

	const initialRole: AssignableWorkspaceRole =
		member.role === "owner" ? (options[0] ?? "viewer") : member.role;

	const [selectedRole, setSelectedRole] =
		useState<AssignableWorkspaceRole>(initialRole);

	const memberName = formatMemberName(member);

	function handleConfirm() {
		changeRole.mutate(
			{
				eden,
				workspaceId,
				memberId: member.userId,
				memberName,
				role: selectedRole,
			},
			{ onSuccess: onClose },
		);
	}

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !changeRole.isPending) onClose();
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Cambiar rol</DialogTitle>
					<DialogDescription>
						Selecciona el nivel de acceso que tendrá este integrante dentro del
						espacio de trabajo.
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center gap-3 rounded-xl border border-border bg-muted/45 px-3.5 py-3">
					<Avatar className="size-9 shrink-0 border border-border">
						<AvatarImage src={member.pictureUrl ?? undefined} />
						<AvatarFallback className="bg-background font-display text-xs font-semibold text-foreground">
							{getInitials(memberName)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold">{memberName}</p>
						<p className="truncate text-xs text-muted-foreground">
							{member.email}
						</p>
					</div>
					<RoleBadge role={member.role} />
				</div>

				<FieldSet>
					<FieldLegend variant="label">Rol asignado</FieldLegend>

					<RadioGroup
						value={selectedRole}
						onValueChange={(value) =>
							setSelectedRole(value as AssignableWorkspaceRole)
						}
					>
						{options.map((roleOption) => {
							const isCurrentRole = member.role === roleOption;

							return (
								<FieldLabel
									key={roleOption}
									htmlFor={`member-role-${roleOption}`}
								>
									<Field orientation="horizontal" className="items-center">
										<FieldContent>
											<FieldTitle className="flex-wrap">
												{WORKSPACE_ROLE_LABELS[roleOption]}
												{isCurrentRole && (
													<Badge
														variant="outline"
														className="rounded-full px-2 py-0 font-mono text-[10px] font-normal text-muted-foreground"
													>
														Actual
													</Badge>
												)}
											</FieldTitle>
											<FieldDescription className="text-xs">
												{ROLE_DESCRIPTIONS[roleOption]}
											</FieldDescription>
										</FieldContent>

										<RadioGroupItem
											id={`member-role-${roleOption}`}
											value={roleOption}
											aria-label={WORKSPACE_ROLE_LABELS[roleOption]}
										/>
									</Field>
								</FieldLabel>
							);
						})}
					</RadioGroup>
				</FieldSet>

				<DialogFooter className="bg-transparent">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={changeRole.isPending}
					>
						Cancelar
					</Button>
					<Button
						type="button"
						disabled={selectedRole === member.role || changeRole.isPending}
						onClick={handleConfirm}
					>
						{changeRole.isPending ? (
							<>
								<Loader2 className="size-3.5 animate-spin" />
								Guardando…
							</>
						) : (
							"Confirmar"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

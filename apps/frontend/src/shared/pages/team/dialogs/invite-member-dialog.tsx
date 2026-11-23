import { Loader2, Mail, Send } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import type { AssignableWorkspaceRole } from "@/features/workpace/common/workspace-role";
import { WORKSPACE_ROLE_LABELS } from "@/features/workpace/common/workspace-role";
import { useInviteWorkspaceMember } from "@/features/workpace/invite-workspace-member";
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
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";
import type { Eden } from "@/shared/http/client";
import { ROLE_DESCRIPTIONS } from "../team.constants";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InviteMemberDialogProps {
	eden: Eden;
	workspaceId: string;
	availableRoles: readonly AssignableWorkspaceRole[];
	onClose: () => void;
}

export function InviteMemberDialog({
	eden,
	workspaceId,
	availableRoles,
	onClose,
}: InviteMemberDialogProps) {
	const invite = useInviteWorkspaceMember();

	const defaultRole: AssignableWorkspaceRole = availableRoles.includes(
		"technician",
	)
		? "technician"
		: (availableRoles[0] ?? "viewer");

	const [email, setEmail] = useState("");
	const [role, setRole] = useState<AssignableWorkspaceRole>(defaultRole);
	const [error, setError] = useState<string | null>(null);

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		const clean = email.trim().toLowerCase();

		if (!clean) {
			setError("Ingresa un correo electrónico.");
			return;
		}

		if (!EMAIL_PATTERN.test(clean)) {
			setError("Ingresa un correo electrónico válido.");
			return;
		}

		if (!availableRoles.includes(role)) {
			setError("No tienes permisos para asignar este rol.");
			return;
		}

		setError(null);
		invite.mutate(
			{ eden, workspaceId, email: clean, role },
			{ onSuccess: onClose },
		);
	}

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !invite.isPending) onClose();
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Invitar miembro</DialogTitle>
					<DialogDescription>
						Envía una invitación por correo electrónico para colaborar en este
						espacio de trabajo.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} noValidate>
					<FieldGroup className="gap-4">
						<Field data-invalid={Boolean(error)}>
							<FieldLabel htmlFor="invite-email">Correo electrónico</FieldLabel>
							<FieldContent>
								<div className="relative">
									<Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										id="invite-email"
										type="email"
										autoFocus
										value={email}
										onChange={(event) => {
											setEmail(event.target.value);
											if (error) setError(null);
										}}
										placeholder="colaborador@empresa.com"
										className="pl-9"
										aria-invalid={Boolean(error)}
									/>
								</div>
								{error && <FieldError className="text-xs">{error}</FieldError>}
							</FieldContent>
						</Field>

						<Field>
							<FieldLabel htmlFor="invite-role">
								Rol en el espacio de trabajo
							</FieldLabel>
							<FieldContent>
								<Select
									items={WORKSPACE_ROLE_LABELS}
									value={role}
									onValueChange={(value) =>
										setRole(value as AssignableWorkspaceRole)
									}
								>
									<SelectTrigger id="invite-role" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											{availableRoles.map((roleOption) => (
												<SelectItem key={roleOption} value={roleOption}>
													{WORKSPACE_ROLE_LABELS[roleOption]}
												</SelectItem>
											))}
										</SelectGroup>
									</SelectContent>
								</Select>
								<FieldDescription className="text-xs">
									{ROLE_DESCRIPTIONS[role]}
								</FieldDescription>
							</FieldContent>
						</Field>
					</FieldGroup>

					<DialogFooter className="mt-4 bg-transparent">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={invite.isPending}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={invite.isPending}>
							{invite.isPending ? (
								<>
									<Loader2 className="size-3.5 animate-spin" />
									Enviando…
								</>
							) : (
								<>
									<Send className="size-3.5" />
									Enviar invitación
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

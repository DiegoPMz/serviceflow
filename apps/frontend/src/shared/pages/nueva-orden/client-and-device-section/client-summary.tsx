import { Mail, Phone, UserRoundCheckIcon } from "lucide-react";
import type { ClientListItem } from "@/features/client/paginated-clients";

export function ClientSummary({ client }: { client: ClientListItem }) {
	return (
		<div className="rounded-xl border border-border/70 bg-card p-3">
			<div className="flex min-w-0 items-center gap-3">
				<div className="p-1 shrink-0 bg-primary text-primary-foreground rounded-sm">
					<UserRoundCheckIcon className="size-5" />
				</div>

				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{client.name}</p>
					<p className="text-xs text-muted-foreground">Cliente seleccionado</p>
				</div>
			</div>

			<div className="mt-3 space-y-2 border-t border-border/70 pt-3">
				<div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
					<Phone className="size-3.5 shrink-0" />
					<span className="truncate text-foreground">
						{client.phoneNumber || "Sin teléfono registrado"}
					</span>
				</div>

				<div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
					<Mail className="size-3.5 shrink-0" />
					<span className="truncate text-foreground">
						{client.email || "Sin correo registrado"}
					</span>
				</div>
			</div>
		</div>
	);
}

import { Mail, MapPin, Phone } from "lucide-react";
import type { ClientDetails } from "@/features/client/client-details";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/shared/components/ui/card";
import { getInitials } from "@/shared/lib/get-initials";
import { CopyButton } from "../../order-detail/copy-button";
import { ClientDetailField } from "./client-detail-field";

export function ClientDetailsCard({ client }: { client: ClientDetails }) {
	const clientInitials = getInitials(client.name);

	return (
		<Card className="animate-rise gap-0 border-border/70 bg-card p-4 shadow-none sm:p-5">
			<CardHeader className="flex flex-row items-center gap-3 px-0 pb-4 sm:pb-5">
				<Avatar className="size-11 shrink-0 rounded-lg">
					<AvatarFallback className="rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-foreground">
						{clientInitials}
					</AvatarFallback>
				</Avatar>

				<div className="min-w-0 flex-1 space-y-1">
					<CardTitle className="truncate text-base font-semibold tracking-tight">
						{client.name}
					</CardTitle>

					<p className="text-xs text-muted-foreground">
						Información del cliente
					</p>
				</div>

				<CopyButton text={getClientCopyText(client)} />
			</CardHeader>

			<CardContent className="grid gap-5 border-t border-border/70 px-0 pt-4 sm:grid-cols-2 sm:pt-5">
				<ClientDetailField
					icon={<Mail />}
					label="Correo electrónico"
					value={client.email}
				/>

				<ClientDetailField
					icon={<Phone />}
					label="Teléfono"
					value={client.phoneNumber}
				/>

				<ClientDetailField
					icon={<MapPin />}
					label="Dirección"
					value={client.location}
				/>
			</CardContent>
		</Card>
	);
}

function getClientCopyText(client: ClientDetails): string {
	return [
		`Cliente: ${client.name}`,
		client.email && `Correo electrónico: ${client.email}`,
		client.phoneNumber && `Teléfono: ${client.phoneNumber}`,
		client.location && `Dirección: ${client.location}`,
	]
		.filter(Boolean)
		.join("\n");
}

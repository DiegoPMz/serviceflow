import { cn } from "cn";
import type { ReactNode } from "react";
import { RegisterClientButton } from "@/shared/components/register-client-button";
import type { Eden } from "@/shared/http/client";

export function ClientsPageLayout({
	children,
	workspaceId,
	eden,
}: {
	children: ReactNode;
	workspaceId: string;
	eden: Eden;
}) {
	return (
		<main className="relative min-w-0 px-4 py-6 sm:px-6 lg:px-8">
			<header className="mb-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end-safe">
				<div>
					<p className="text-[11px] uppercase tracking-widest text-primary">
						Consulta y administra los clientes de tu espacio
					</p>

					<h2 className="mt-1 text-3xl font-bold lg:text-4xl">Clientes</h2>
				</div>

				<RegisterClientButton
					className="hidden xl:flex"
					workspaceId={workspaceId}
					eden={eden}
				/>
			</header>

			<div
				className={cn(
					"grid min-w-0 grid-cols-1 gap-4",
					"xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start",
				)}
			>
				{children}
			</div>
		</main>
	);
}

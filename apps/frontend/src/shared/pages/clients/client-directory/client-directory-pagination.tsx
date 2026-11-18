import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function ClientDirectoryPagination({
	totalCount,
	isLoading,
	onLoadMore,
	hasError,
}: {
	totalCount: number;
	isLoading: boolean;
	hasError?: boolean;
	onLoadMore: () => void;
}) {
	return (
		<div className="flex flex-col items-center gap-2 p-3">
			{hasError && (
				<p role="alert" className="text-center text-xs text-muted-foreground">
					No se pudieron cargar más clientes.
				</p>
			)}

			<Button
				variant="outline"
				className="h-10 w-full"
				onClick={onLoadMore}
				disabled={isLoading}
			>
				{isLoading ? (
					<>
						<LoaderCircle className="size-4 animate-spin" />
						Cargando...
					</>
				) : hasError ? (
					<>
						<RefreshCw className="size-4" />
						Reintentar
					</>
				) : (
					"Cargar más"
				)}
			</Button>

			<p className="text-[11px] text-muted-foreground">
				Mostrando {totalCount} clientes
			</p>
		</div>
	);
}

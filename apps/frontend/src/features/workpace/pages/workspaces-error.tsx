import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { SceneLayout } from "@/shared/layouts/scene-layout";

export function WorkspacesError({ error, reset }: ErrorComponentProps) {
	return (
		<SceneLayout className="flex flex-col">
			<main className="relative mx-auto flex max-w-xl flex-1 items-center justify-center px-4 py-20 sm:px-6">
				<div
					className="glass-panel w-full rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center shadow-lg"
					style={{ animation: "rise 600ms cubic-bezier(0.32,0.72,0,1) both" }}
				>
					<div className="mx-auto mb-4 grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
						<AlertCircle className="size-5" />
					</div>

					<h3 className="text-sm font-semibold text-foreground">
						No pudimos cargar tus espacios de trabajo
					</h3>

					<p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
						{error instanceof Error
							? error.message
							: "Ocurrió un error inesperado de conexión."}
					</p>

					<Button
						variant="outline"
						size="sm"
						onClick={() => reset()}
						className="mt-5 inline-flex items-center gap-2 border-border/60 bg-background/50 hover:bg-background"
					>
						<RotateCcw className="size-3.5" /> Reintentar
					</Button>
				</div>
			</main>
		</SceneLayout>
	);
}

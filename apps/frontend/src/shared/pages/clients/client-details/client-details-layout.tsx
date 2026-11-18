import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { ArrowLeft } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function ClientDetailsLayout({
	workspaceId,
	children,
}: PropsWithChildren<{ workspaceId: string }>) {
	return (
		<div className="min-w-0 space-y-4">
			{/* Back navigation */}
			<Link
				to="/workspace/$workspaceId/clientes"
				params={{ workspaceId }}
				className={cn(
					"inline-flex items-center gap-2 text-sm",
					"text-muted-foreground transition-colors hover:text-foreground",
					"xl:hidden",
				)}
			>
				<ArrowLeft className="size-4" />
				Volver a clientes
			</Link>

			{children}
		</div>
	);
}

export function ClientDetailsLayoutSkeleton({ children }: PropsWithChildren) {
	return (
		<div className="min-w-0 space-y-4" aria-busy="true">
			<Skeleton className="h-4 w-32 xl:hidden" />
			{children}
		</div>
	);
}

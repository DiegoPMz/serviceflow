import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import {
	ArrowUpRight,
	Monitor,
	Plus,
	UserRoundPlus,
	Users,
	Zap,
} from "lucide-react";
import { IconContainer } from "@/shared/components/icon-container";
import { Button, buttonVariants } from "@/shared/components/ui/button";

export function QuickActionsSection({
	canInviteMembers,
}: {
	canInviteMembers: boolean;
}) {
	return (
		<section
			aria-labelledby="quick-actions-heading"
			className="animate-rise rounded-xl border border-border/70 bg-card p-4 sm:p-5"
		>
			{/* Header */}
			<div className="mb-4 flex items-center gap-3">
				<IconContainer icon={Zap} />

				<div className="min-w-0">
					<h2
						id="quick-actions-heading"
						className="text-sm font-semibold tracking-tight"
					>
						Acciones rápidas
					</h2>

					<p className="mt-0.5 text-xs text-muted-foreground">
						Accesos directos
					</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2">
				{/* Primary action */}
				<Link
					from="/workspace/$workspaceId"
					to="/workspace/$workspaceId/orden/nueva"
					className={cn(
						buttonVariants({ size: "lg" }),
						"col-span-2 justify-between px-3.5",
					)}
				>
					<span className="flex min-w-0 items-center gap-2.5">
						<Plus className="size-4 shrink-0" />
						<span className="truncate">Nueva orden</span>
					</span>

					<ArrowUpRight className="size-4 shrink-0 opacity-80" />
				</Link>

				{/* Secondary actions */}
				<Button
					variant="secondary"
					size="sm"
					className="min-w-0 justify-center gap-2"
				>
					<UserRoundPlus className="size-4 shrink-0" />
					<span className="min-w-0 truncate">Cliente</span>
				</Button>

				<Button
					variant="secondary"
					size="sm"
					className=" min-w-0 justify-center "
				>
					<Monitor className="size-4 shrink-0" />
					<span className="min-w-0 truncate">Dispositivo</span>
				</Button>

				{canInviteMembers && (
					<Button
						variant="outline"
						size="lg"
						className="col-span-2  min-w-0 justify-center "
					>
						<Users className="size-4 shrink-0" />
						<span className="min-w-0 truncate">Invitar a mi equipo</span>
					</Button>
				)}
			</div>
		</section>
	);
}

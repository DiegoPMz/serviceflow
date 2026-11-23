import { CalendarDays, Mail, Trash2, UserCog } from "lucide-react";
import type { WorkspaceMemberListItem } from "@/features/workpace/paginated-workspace-members";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatRelativeTime } from "@/shared/lib/format-relative-time";
import { getInitials } from "@/shared/lib/get-initials";
import { formatMemberName } from "../team.presentation";
import { RoleBadge } from "./team-role-badge";

export function MemberRowCard({
	member,
	canManage,
	onChangeRole,
	onRemove,
}: {
	member: WorkspaceMemberListItem;
	canManage: boolean;
	onChangeRole: () => void;
	onRemove: () => void;
}) {
	const memberName = formatMemberName(member);

	return (
		<article className="animate-rise group flex flex-col gap-3 rounded-xl border border-border/80 bg-card/50 p-4 transition-colors hover:bg-card sm:flex-row sm:items-center sm:justify-between sm:gap-5">
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<Avatar size="lg" className="shrink-0">
					{member.pictureUrl && (
						<AvatarImage src={member.pictureUrl} alt={member.name} />
					)}
					<AvatarFallback className="font-display text-xs font-semibold">
						{getInitials(memberName)}
					</AvatarFallback>
				</Avatar>

				<div className="min-w-0 flex-1 space-y-2">
					<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
						<p className="truncate font-display text-sm font-semibold leading-tight text-foreground">
							{memberName}
						</p>

						<RoleBadge role={member.role} />
					</div>

					<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
						<span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
							<Mail className="size-3.5 shrink-0 text-muted-foreground/80" />
							<span className="truncate">{member.email}</span>
						</span>

						<span className="hidden h-3 w-px bg-border sm:block" />

						<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
							<CalendarDays className="size-3.5 shrink-0 text-muted-foreground/80" />
							Se unió {formatRelativeTime(member.joinedAt).label}
						</span>
					</div>
				</div>
			</div>

			{canManage && (
				<div className="flex items-center gap-2 border-t border-border/70 pt-3 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
					<Button
						type="button"
						variant="glass"
						size="sm"
						onClick={onChangeRole}
						className="flex-1 sm:flex-initial"
					>
						<UserCog className="size-3.5" />
						Cambiar rol
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onRemove}
						className="flex-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:flex-initial"
					>
						<Trash2 className="size-3.5" />
						Eliminar
					</Button>
				</div>
			)}
		</article>
	);
}

export function MemberRowCardSkeleton() {
	return (
		<article className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<Skeleton className="size-12 shrink-0 rounded-full" />

				<div className="min-w-0 flex-1 space-y-2">
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-32 max-w-[55%]" />
						<Skeleton className="h-5 w-16 rounded-full" />
					</div>

					<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
						<div className="flex items-center gap-1.5">
							<Skeleton className="size-3.5 rounded-sm" />
							<Skeleton className="h-3 w-36 max-w-[40vw]" />
						</div>

						<Skeleton className="hidden h-3 w-px sm:block" />

						<div className="flex items-center gap-1.5">
							<Skeleton className="size-3.5 rounded-sm" />
							<Skeleton className="h-3 w-24" />
						</div>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2 border-t border-border/70 pt-3 sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
				<Skeleton className="h-8 flex-1 rounded-md sm:w-28 sm:flex-initial" />
				<Skeleton className="h-8 flex-1 rounded-md sm:w-24 sm:flex-initial" />
			</div>
		</article>
	);
}

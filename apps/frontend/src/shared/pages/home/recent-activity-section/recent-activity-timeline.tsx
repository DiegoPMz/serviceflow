import { cn } from "cn";
import {
	describeRecentActivity,
	type RecentActivity,
} from "@/features/activity/recent-activities";
import { formatRelativeTime } from "@/shared/lib/format-relative-time";

export function RecentActivityTimeline({
	activities,
}: {
	activities: RecentActivity[];
}) {
	return (
		<ol className="relative mt-5 flex min-w-0 flex-col gap-4 before:absolute before:bottom-2 before:left-0.75 before:top-2 before:w-0.5 before:bg-border before:content-['']">
			{activities.map((activity) => {
				const presentation = describeRecentActivity(activity);
				const time = formatRelativeTime(activity.occurredAt);

				return (
					<li key={activity.id} className="relative flex min-w-0 gap-3">
						<span
							aria-hidden="true"
							className={cn(
								"relative outline-2 outline-border z-10 mt-1.5 size-2 shrink-0 rounded-full",
								"ring-4 ring-card",
								presentation.toneClassName,
							)}
						/>

						<div className="min-w-0 flex-1">
							<p className="wrap-break-word truncate text-sm font-medium leading-5 text-card-foreground">
								{presentation.label}
							</p>

							<p className="mt-1 truncate text-xs leading-4 text-muted-foreground">
								<time dateTime={time.dateTime} title={time.title}>
									{time.label}
								</time>
							</p>
						</div>
					</li>
				);
			})}
		</ol>
	);
}

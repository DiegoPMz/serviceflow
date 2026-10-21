CREATE TABLE `workspace_activities` (
	`id` text(26) PRIMARY KEY NOT NULL,
	`workspace_id` text(26) NOT NULL,
	`actor_user_id` text(26) NOT NULL,
	`actor_name_snapshot` text(200) NOT NULL,
	`type` text NOT NULL,
	`entity_id` text(26),
	`entity_label` text(255) NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workspace_activities_workspace_date_idx` ON `workspace_activities` (`workspace_id`,`created_at`);
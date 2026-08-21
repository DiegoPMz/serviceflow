CREATE TABLE `clients` (
	`id` text(26) PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text(150) NOT NULL,
	`phone_number` text(20) NOT NULL,
	`email` text(200) NOT NULL,
	`location` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `clients_workspace_name_idx` ON `clients` (`workspace_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `client_email_workspace_idx` ON `clients` (`email`,`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `client_phone_workspace_idx` ON `clients` (`phone_number`,`workspace_id`);--> statement-breakpoint
CREATE TABLE `device_components` (
	`id` text(26) PRIMARY KEY NOT NULL,
	`device_id` text(26) NOT NULL,
	`name` text(150) NOT NULL,
	`part_number` text(100) NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `device_components_device_id_idx` ON `device_components` (`device_id`);--> statement-breakpoint
CREATE INDEX `device_components_device_part_idx` ON `device_components` (`device_id`,`part_number`);--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text(26) PRIMARY KEY NOT NULL,
	`workspace_id` text(26) NOT NULL,
	`client_id` text(26) NOT NULL,
	`serial_number` text(200) NOT NULL,
	`brand` text(50) NOT NULL,
	`model` text(100) NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `devices_client_id_idx` ON `devices` (`client_id`);--> statement-breakpoint
CREATE INDEX `devices_workspace_id_idx` ON `devices` (`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `devices_workspace_serial_unique_idx` ON `devices` (`workspace_id`,`serial_number`);--> statement-breakpoint
CREATE TABLE `order_components` (
	`id` text(26) PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`device_component_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`component_name_snapshot` text NOT NULL,
	`part_number_snapshot` text NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_component_id`) REFERENCES `device_components`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text(26) PRIMARY KEY NOT NULL,
	`folio` text NOT NULL,
	`workspace_id` text(26) NOT NULL,
	`client_id` text(26) NOT NULL,
	`device_id` text(26) NOT NULL,
	`user_id` text(26) NOT NULL,
	`client_name_snapshot` text(200) NOT NULL,
	`client_email_snapshot` text(250) NOT NULL,
	`client_phone_snapshot` text(15) NOT NULL,
	`client_location_snapshot` text NOT NULL,
	`device_brand_snapshot` text(50) NOT NULL,
	`device_model_snapshot` text(100) NOT NULL,
	`device_serial_number_snapshot` text(200) NOT NULL,
	`user_name_snapshot` text(200) NOT NULL,
	`document_key` text,
	`status` text DEFAULT 'pendiente' NOT NULL,
	`observations` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_folio_unique` ON `orders` (`folio`);--> statement-breakpoint
CREATE INDEX `orders_workspace_id_idx` ON `orders` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `orders_client_id_idx` ON `orders` (`client_id`);--> statement-breakpoint
CREATE INDEX `orders_user_id_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_device_id_idx` ON `orders` (`device_id`);--> statement-breakpoint
CREATE INDEX `orders_workspace_date_idx` ON `orders` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_workspace_status_idx` ON `orders` (`workspace_id`,`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text(26) PRIMARY KEY NOT NULL,
	`name` text(200) NOT NULL,
	`email` text(200) NOT NULL,
	`picture_url` text,
	`last_name` text,
	`phone` text,
	`external_id` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_external_id_unique` ON `users` (`external_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_name_idx` ON `users` (`name`);--> statement-breakpoint
CREATE TABLE `workspace_invitations` (
	`token` text(21) NOT NULL,
	`workspace_id` text(26) NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`email` text NOT NULL,
	`email_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`accepted_at` integer,
	`cancelled_at` integer,
	`rejected_at` integer,
	`expiration_days` integer DEFAULT 7 NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	PRIMARY KEY(`workspace_id`, `email`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `invitation_workspace_idx` ON `workspace_invitations` (`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_token_unique_idx` ON `workspace_invitations` (`token`);--> statement-breakpoint
CREATE TABLE `workspace_members` (
	`workspace_id` text(26) NOT NULL,
	`user_id` text(26) NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`joined_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	PRIMARY KEY(`workspace_id`, `user_id`),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `member_workspace_idx` ON `workspace_members` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `member_user_idx` ON `workspace_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text(26) PRIMARY KEY NOT NULL,
	`name` text(250) NOT NULL,
	`prefix` text(7) NOT NULL,
	`order_count` integer DEFAULT 0 NOT NULL,
	`company_name` text(150) NOT NULL,
	`company_phone` text(50) NOT NULL,
	`company_email` text(150) NOT NULL,
	`company_address` text(255) NOT NULL,
	`company_logo_key` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workspaces_name_idx` ON `workspaces` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_prefix_unique_idx` ON `workspaces` (`prefix`);
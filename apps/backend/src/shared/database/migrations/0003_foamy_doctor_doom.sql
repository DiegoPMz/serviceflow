DROP INDEX "workspace_activities_workspace_date_idx";--> statement-breakpoint
DROP INDEX "clients_workspace_name_idx";--> statement-breakpoint
DROP INDEX "client_email_workspace_idx";--> statement-breakpoint
DROP INDEX "client_phone_workspace_idx";--> statement-breakpoint
DROP INDEX "device_components_device_id_idx";--> statement-breakpoint
DROP INDEX "device_components_device_part_idx";--> statement-breakpoint
DROP INDEX "devices_client_id_idx";--> statement-breakpoint
DROP INDEX "devices_workspace_id_idx";--> statement-breakpoint
DROP INDEX "devices_workspace_serial_unique_idx";--> statement-breakpoint
DROP INDEX "orders_folio_unique";--> statement-breakpoint
DROP INDEX "orders_workspace_id_idx";--> statement-breakpoint
DROP INDEX "orders_client_id_idx";--> statement-breakpoint
DROP INDEX "orders_user_id_idx";--> statement-breakpoint
DROP INDEX "orders_device_id_idx";--> statement-breakpoint
DROP INDEX "orders_workspace_date_idx";--> statement-breakpoint
DROP INDEX "orders_workspace_status_idx";--> statement-breakpoint
DROP INDEX "users_phone_unique";--> statement-breakpoint
DROP INDEX "users_external_id_unique";--> statement-breakpoint
DROP INDEX "users_email_unique_idx";--> statement-breakpoint
DROP INDEX "users_name_idx";--> statement-breakpoint
DROP INDEX "invitation_workspace_idx";--> statement-breakpoint
DROP INDEX "invitation_token_unique_idx";--> statement-breakpoint
DROP INDEX "member_workspace_idx";--> statement-breakpoint
DROP INDEX "member_user_idx";--> statement-breakpoint
DROP INDEX "workspaces_name_idx";--> statement-breakpoint
DROP INDEX "workspaces_prefix_unique_idx";--> statement-breakpoint
ALTER TABLE `workspace_activities` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
CREATE INDEX `workspace_activities_workspace_date_idx` ON `workspace_activities` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `clients_workspace_name_idx` ON `clients` (`workspace_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `client_email_workspace_idx` ON `clients` (`email`,`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `client_phone_workspace_idx` ON `clients` (`phone_number`,`workspace_id`);--> statement-breakpoint
CREATE INDEX `device_components_device_id_idx` ON `device_components` (`device_id`);--> statement-breakpoint
CREATE INDEX `device_components_device_part_idx` ON `device_components` (`device_id`,`part_number`);--> statement-breakpoint
CREATE INDEX `devices_client_id_idx` ON `devices` (`client_id`);--> statement-breakpoint
CREATE INDEX `devices_workspace_id_idx` ON `devices` (`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `devices_workspace_serial_unique_idx` ON `devices` (`workspace_id`,`serial_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_folio_unique` ON `orders` (`folio`);--> statement-breakpoint
CREATE INDEX `orders_workspace_id_idx` ON `orders` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `orders_client_id_idx` ON `orders` (`client_id`);--> statement-breakpoint
CREATE INDEX `orders_user_id_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_device_id_idx` ON `orders` (`device_id`);--> statement-breakpoint
CREATE INDEX `orders_workspace_date_idx` ON `orders` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_workspace_status_idx` ON `orders` (`workspace_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_external_id_unique` ON `users` (`external_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_name_idx` ON `users` (`name`);--> statement-breakpoint
CREATE INDEX `invitation_workspace_idx` ON `workspace_invitations` (`workspace_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_token_unique_idx` ON `workspace_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `member_workspace_idx` ON `workspace_members` (`workspace_id`);--> statement-breakpoint
CREATE INDEX `member_workspace_joined_idx` ON `workspace_members` (`workspace_id`,`joined_at`,`user_id`);--> statement-breakpoint
CREATE INDEX `member_user_idx` ON `workspace_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `workspaces_name_idx` ON `workspaces` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_prefix_unique_idx` ON `workspaces` (`prefix`);--> statement-breakpoint
ALTER TABLE `clients` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `clients` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `device_components` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `device_components` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `devices` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `devices` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `order_components` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `orders` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `orders` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `workspace_invitations` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `workspace_members` ALTER COLUMN "joined_at" TO "joined_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `workspace_members` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `workspaces` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
ALTER TABLE `workspaces` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL DEFAULT (unixepoch());--> statement-breakpoint
UPDATE `workspace_activities` SET `created_at` = `created_at` / 1000 WHERE `created_at` > 100000000000;--> statement-breakpoint
UPDATE `clients` SET `created_at` = `created_at` / 1000 WHERE `created_at` > 100000000000;--> statement-breakpoint
UPDATE `clients` SET `updated_at` = `updated_at` / 1000 WHERE `updated_at` > 100000000000;--> statement-breakpoint
UPDATE `device_components` SET `created_at` = `created_at` / 1000 WHERE `created_at` > 100000000000;--> statement-breakpoint
UPDATE `device_components` SET `updated_at` = `updated_at` / 1000 WHERE `updated_at` > 100000000000;--> statement-breakpoint
UPDATE `devices` SET `created_at` = `created_at` / 1000 WHERE `created_at` > 100000000000;--> statement-breakpoint
UPDATE `devices` SET `updated_at` = `updated_at` / 1000 WHERE `updated_at` > 100000000000;--> statement-breakpoint
UPDATE `order_components` SET `created_at` = `created_at` / 1000 WHERE `created_at` > 100000000000;--> statement-breakpoint
UPDATE `orders` SET `created_at` = `created_at` / 1000 WHERE `created_at` > 100000000000;--> statement-breakpoint
UPDATE `orders` SET `updated_at` = `updated_at` / 1000 WHERE `updated_at` > 100000000000;--> statement-breakpoint
UPDATE `users` SET `created_at` = `created_at` / 1000 WHERE `created_at` > 100000000000;--> statement-breakpoint
UPDATE `users` SET `updated_at` = `updated_at` / 1000 WHERE `updated_at` > 100000000000;--> statement-breakpoint
UPDATE `workspace_invitations` SET `created_at` = `created_at` / 1000 WHERE `created_at` > 100000000000;--> statement-breakpoint
UPDATE `workspace_members` SET `joined_at` = `joined_at` / 1000 WHERE `joined_at` > 100000000000;--> statement-breakpoint
UPDATE `workspace_members` SET `updated_at` = `updated_at` / 1000 WHERE `updated_at` > 100000000000;--> statement-breakpoint
UPDATE `workspaces` SET `created_at` = `created_at` / 1000 WHERE `created_at` > 100000000000;--> statement-breakpoint
UPDATE `workspaces` SET `updated_at` = `updated_at` / 1000 WHERE `updated_at` > 100000000000;
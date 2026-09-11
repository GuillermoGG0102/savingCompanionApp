CREATE TABLE `asset_transfer` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_asset_id` integer NOT NULL,
	`to_asset_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	FOREIGN KEY (`from_asset_id`) REFERENCES `asset`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_asset_id`) REFERENCES `asset`(`id`) ON UPDATE no action ON DELETE no action
);

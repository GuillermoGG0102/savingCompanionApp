CREATE TABLE `dismissed_fixed_suggestion` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subcategory_id` integer NOT NULL,
	`dismissed_at` text NOT NULL,
	FOREIGN KEY (`subcategory_id`) REFERENCES `subcategory`(`id`) ON UPDATE no action ON DELETE no action
);

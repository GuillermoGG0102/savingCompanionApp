CREATE TABLE `asset` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `asset_snapshot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`asset_id` integer NOT NULL,
	`month_key` text NOT NULL,
	`value` integer NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`kind` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `expense` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subcategory_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`note` text,
	FOREIGN KEY (`subcategory_id`) REFERENCES `subcategory`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fixed_expense` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`amount` integer NOT NULL,
	`day_of_month` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `month_close` (
	`month_key` text PRIMARY KEY NOT NULL,
	`income` integer NOT NULL,
	`fixed_total` integer NOT NULL,
	`variable_total` integer NOT NULL,
	`net_worth` integer NOT NULL,
	`savings_rate` real NOT NULL,
	`closed_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`annual_salary` integer NOT NULL,
	`monthly_net_pay` integer NOT NULL,
	`currency` text NOT NULL,
	`pay_day_of_month` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subcategory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);

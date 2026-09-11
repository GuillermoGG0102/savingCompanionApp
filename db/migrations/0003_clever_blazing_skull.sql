CREATE TABLE `additional_income` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`note` text
);
--> statement-breakpoint
ALTER TABLE `profile` ADD `pay_periods_per_year` integer DEFAULT 12 NOT NULL;
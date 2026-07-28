CREATE TABLE `features` (
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sort_order` integer DEFAULT 0,
	`title` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `techs` (
	`description` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`url` text NOT NULL,
	`version` text NOT NULL
);

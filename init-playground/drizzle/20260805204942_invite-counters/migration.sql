CREATE TABLE `visit_counters` (
	`counter` integer DEFAULT 0 NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visit_counters_name_unique` ON `visit_counters` (`name`);
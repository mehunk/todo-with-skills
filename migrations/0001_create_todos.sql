CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`list_id` text NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `todos_list_id_idx` ON `todos` (`list_id`);
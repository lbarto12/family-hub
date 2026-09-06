CREATE TABLE "server_snapshots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"service" varchar NOT NULL,
	"state" varchar NOT NULL,
	"sub_state" varchar,
	"running" boolean NOT NULL,
	"reachable" boolean DEFAULT true NOT NULL,
	"main_pid" integer,
	"memory_bytes" bigint,
	"cpu_seconds" double precision,
	"tasks" integer,
	"active_for_seconds" double precision,
	"recorded_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "index_server_snapshots_service_time" ON "server_snapshots" USING btree ("service","recorded_at");
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	"family_id" uuid NOT NULL,
	"token" varchar NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"expires_t" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "index_refresh_token_hash" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "index_refresh_token_family" ON "refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "index_refresh_token_user" ON "refresh_tokens" USING btree ("user_id");
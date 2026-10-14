CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"first_name" varchar NOT NULL,
	"last_name" varchar DEFAULT '' NOT NULL,
	"organization" varchar DEFAULT '' NOT NULL,
	"email" varchar DEFAULT '' NOT NULL,
	"phone_number" varchar DEFAULT '' NOT NULL,
	"street" varchar DEFAULT '' NOT NULL,
	"city" varchar DEFAULT '' NOT NULL,
	"region" varchar DEFAULT '' NOT NULL,
	"postal_code" varchar DEFAULT '' NOT NULL,
	"country" varchar DEFAULT '' NOT NULL,
	"notes" varchar DEFAULT '' NOT NULL
);

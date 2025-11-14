CREATE TYPE "public"."sentiment_type" AS ENUM('GOOD', 'BAD', 'NEUTRAL');--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar(1000) NOT NULL,
	"sentiment" "sentiment_type" NOT NULL,
	"confidence_score" numeric(5, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

import { pgTable, serial, varchar, timestamp, pgEnum, decimal } from 'drizzle-orm/pg-core';

// Sentiment enum type
export const sentimentEnum = pgEnum('sentiment_type', ['GOOD', 'BAD', 'NEUTRAL']);

// Feedback table
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  text: varchar('text', { length: 1000 }).notNull(),
  sentiment: sentimentEnum('sentiment').notNull(),
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

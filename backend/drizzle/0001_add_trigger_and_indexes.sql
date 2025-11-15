-- Migration: Add updated_at trigger and performance indexes
-- Created: 2025-11-15

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to call the function before any UPDATE on feedback table
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add index on sentiment column for filtering performance
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);

-- Add index on created_at column for sorting performance (DESC for recent first)
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Add composite index for common query pattern (sentiment + created_at)
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment_created_at ON feedback(sentiment, created_at DESC);

-- Add thumbnail_url column to reviews table for video thumbnail images
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Migration 002: Portfolio table + profile columns extension
-- Run this in the Supabase SQL Editor

-- ============================================================
-- 1. Add new columns to profiles (idempotent via DO blocks)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tagline'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tagline text CHECK (char_length(tagline) <= 150);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'category'
  ) THEN
    ALTER TABLE profiles ADD COLUMN category text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_public boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- ============================================================
-- 2. Create freelancer_portfolio table
-- ============================================================
CREATE TABLE IF NOT EXISTS freelancer_portfolio (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url      text NOT NULL,
  caption        text CHECK (char_length(caption) <= 200),
  display_order  integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. RLS policies for freelancer_portfolio
-- ============================================================
ALTER TABLE freelancer_portfolio ENABLE ROW LEVEL SECURITY;

-- Everyone can read portfolio items
CREATE POLICY "portfolio_select_public"
  ON freelancer_portfolio
  FOR SELECT
  USING (true);

-- Only the owning freelancer can insert
CREATE POLICY "portfolio_insert_own"
  ON freelancer_portfolio
  FOR INSERT
  WITH CHECK (auth.uid() = freelancer_id);

-- Only the owning freelancer can delete
CREATE POLICY "portfolio_delete_own"
  ON freelancer_portfolio
  FOR DELETE
  USING (auth.uid() = freelancer_id);

-- ============================================================
-- 4. Storage bucket: portfolio-media
-- Run these via Supabase Dashboard > Storage, or with the
-- management API. SQL Storage DDL is not supported in the
-- SQL Editor, so the commands below are reference only.
--
-- Bucket name : portfolio-media
-- Public      : true  (public read)
-- File size   : 50 MB
-- Allowed MIME: image/*, video/*
-- Path pattern: {freelancer_id}/{filename}
--
-- RLS storage policies to create in Dashboard:
--   SELECT  (anon + authenticated): bucket_id = 'portfolio-media'
--   INSERT  (authenticated only)  : bucket_id = 'portfolio-media'
--                                   AND auth.uid()::text = (storage.foldername(name))[1]
-- ============================================================

-- Migration 003: Add new columns to reviews table
-- Run this in Supabase SQL Editor before testing the new ReviewUpload feature.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS photo_url   text,
  ADD COLUMN IF NOT EXISTS caption     text CHECK (char_length(caption) <= 150),
  ADD COLUMN IF NOT EXISTS has_video   boolean DEFAULT false NOT NULL;

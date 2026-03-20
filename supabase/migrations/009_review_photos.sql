-- Migration 009: Create review_photos table
-- Run this in Supabase SQL Editor.
-- This table stores multiple photos per review (client receipts).

CREATE TABLE IF NOT EXISTS public.review_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id     uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  image_url     text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review photos are viewable by everyone"
  ON public.review_photos FOR SELECT
  USING (true);

CREATE POLICY "Authenticated clients can insert review photos"
  ON public.review_photos FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.reviews
      WHERE id = review_id AND client_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own review photos"
  ON public.review_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE id = review_id AND client_id = auth.uid()
    )
  );

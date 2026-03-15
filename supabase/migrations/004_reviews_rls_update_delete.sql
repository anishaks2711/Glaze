-- Migration 004: Add UPDATE and DELETE RLS policies for reviews table
-- Clients may only UPDATE or DELETE reviews they themselves created.

-- UPDATE: only the client who wrote the review
CREATE POLICY "Clients can update their own reviews"
  ON reviews
  FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- DELETE: only the client who wrote the review
CREATE POLICY "Clients can delete their own reviews"
  ON reviews
  FOR DELETE
  USING (auth.uid() = client_id);

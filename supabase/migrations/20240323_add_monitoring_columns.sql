-- Migration: Add monitoring columns and pg_cron setup
-- ====================================================
-- This migration adds the necessary columns for server-side area scanning
-- and sets up pg_cron to trigger the Edge Function periodically.

-- =========================================
-- 1. ADD MONITORING COLUMNS TO saved_areas
-- =========================================

-- Add is_monitoring column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_areas' AND column_name = 'is_monitoring'
  ) THEN
    ALTER TABLE saved_areas ADD COLUMN is_monitoring BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add monitor_interval_minutes column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_areas' AND column_name = 'monitor_interval_minutes'
  ) THEN
    ALTER TABLE saved_areas ADD COLUMN monitor_interval_minutes INTEGER DEFAULT 60 CHECK (monitor_interval_minutes >= 5);
  END IF;
END $$;

-- Add last_scanned_at column to track when each area was last scanned
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_areas' AND column_name = 'last_scanned_at'
  ) THEN
    ALTER TABLE saved_areas ADD COLUMN last_scanned_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- =========================================
-- 2. CREATE area_sightings TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS area_sightings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES saved_areas(id) ON DELETE CASCADE,
  mmsi TEXT NOT NULL,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  course DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  spotted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on area_sightings
ALTER TABLE area_sightings ENABLE ROW LEVEL SECURITY;

-- RLS policies for area_sightings (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'area_sightings' AND policyname = 'Users can view own sightings'
  ) THEN
    CREATE POLICY "Users can view own sightings"
      ON area_sightings FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'area_sightings' AND policyname = 'Users can insert own sightings'
  ) THEN
    CREATE POLICY "Users can insert own sightings"
      ON area_sightings FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'area_sightings' AND policyname = 'Users can delete own sightings'
  ) THEN
    CREATE POLICY "Users can delete own sightings"
      ON area_sightings FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Service role can insert sightings (for Edge Function)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'area_sightings' AND policyname = 'Service role can insert sightings'
  ) THEN
    CREATE POLICY "Service role can insert sightings"
      ON area_sightings FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Indexes for area_sightings
CREATE INDEX IF NOT EXISTS idx_area_sightings_user_id ON area_sightings(user_id);
CREATE INDEX IF NOT EXISTS idx_area_sightings_area_id ON area_sightings(area_id);
CREATE INDEX IF NOT EXISTS idx_area_sightings_mmsi ON area_sightings(mmsi);
CREATE INDEX IF NOT EXISTS idx_area_sightings_spotted_at ON area_sightings(spotted_at DESC);

-- =========================================
-- 3. PG_CRON SETUP (Supabase Pro plan required)
-- =========================================
-- NOTE: pg_cron is only available on Supabase Pro plan.
-- The cron job calls the Edge Function every 5 minutes.
-- The Edge Function itself checks each area's interval to decide what to scan.

-- Enable pg_cron extension (requires Pro plan)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job that runs every 5 minutes
-- This calls the scan-areas Edge Function with the service role key
--
-- IMPORTANT: Replace YOUR_PROJECT_REF with your actual project reference
-- and SERVICE_ROLE_KEY with your service role key (keep it secret!)
--
-- To set up the cron job, run this in the Supabase SQL Editor:
--
-- SELECT cron.schedule(
--   'scan-monitored-areas',
--   '*/5 * * * *',  -- Every 5 minutes
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/scan-areas',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer SERVICE_ROLE_KEY'
--     ),
--     body := jsonb_build_object('force_all', false)
--   );
--   $$
-- );
--
-- To view scheduled jobs:
-- SELECT * FROM cron.job;
--
-- To remove the job:
-- SELECT cron.unschedule('scan-monitored-areas');

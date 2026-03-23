-- Vessel Area Tracker - Additional Tables
-- =========================================
-- This schema is designed to work alongside the existing sea-trace-app tables.
-- It reuses the existing 'profiles' and 'api_calls' tables.
-- Only run this SQL to add the NEW tables required for the Vessel Area Tracker app.

-- =========================================
-- NEW TABLES FOR VESSEL AREA TRACKER
-- =========================================

-- Saved Areas table (stores user's saved search areas for vessel-by-area searches)
-- This is a NEW table specific to this app
CREATE TABLE IF NOT EXISTS saved_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_km INTEGER NOT NULL CHECK (radius_km >= 1 AND radius_km <= 50),
  is_monitoring BOOLEAN DEFAULT false,
  monitor_interval_minutes INTEGER DEFAULT 60 CHECK (monitor_interval_minutes >= 5),
  last_scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Area Sightings table (stores vessels spotted during area scans)
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

-- Tracked Vessels table (stores vessels discovered via area search that user wants to track)
-- This is a NEW table specific to this app - different from sea-trace-app's 'vessels' table
CREATE TABLE IF NOT EXISTS tracked_vessels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID REFERENCES saved_areas(id) ON DELETE SET NULL,
  mmsi TEXT NOT NULL,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  course DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mmsi)
);

-- =========================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- =========================================

ALTER TABLE saved_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_sightings ENABLE ROW LEVEL SECURITY;

-- Policies for saved_areas
CREATE POLICY "Users can view own areas"
  ON saved_areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own areas"
  ON saved_areas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own areas"
  ON saved_areas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own areas"
  ON saved_areas FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for tracked_vessels
CREATE POLICY "Users can view own tracked vessels"
  ON tracked_vessels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracked vessels"
  ON tracked_vessels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracked vessels"
  ON tracked_vessels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracked vessels"
  ON tracked_vessels FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for area_sightings
CREATE POLICY "Users can view own sightings"
  ON area_sightings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sightings"
  ON area_sightings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sightings"
  ON area_sightings FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================
-- INDEXES FOR NEW TABLES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_saved_areas_user_id ON saved_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_vessels_user_id ON tracked_vessels(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_vessels_mmsi ON tracked_vessels(mmsi);
CREATE INDEX IF NOT EXISTS idx_area_sightings_user_id ON area_sightings(user_id);
CREATE INDEX IF NOT EXISTS idx_area_sightings_area_id ON area_sightings(area_id);
CREATE INDEX IF NOT EXISTS idx_area_sightings_mmsi ON area_sightings(mmsi);
CREATE INDEX IF NOT EXISTS idx_area_sightings_spotted_at ON area_sightings(spotted_at DESC);

-- =========================================
-- NOTES ON SHARED TABLES
-- =========================================
-- This app reuses the following existing tables from sea-trace-app:
--
-- 1. profiles - Stores user API keys (already exists)
--    - The 'api_key' column is used to store the DataDocked API key
--    - Both apps share the same API key per user
--
-- 2. api_calls - Logs API usage (already exists)
--    - Can be used to track API calls from this app too
--
-- No modifications to these tables are needed.

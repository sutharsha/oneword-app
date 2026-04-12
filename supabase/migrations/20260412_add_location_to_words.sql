-- Add IP address and geolocation columns to words table
ALTER TABLE words ADD COLUMN IF NOT EXISTS ip_address inet;
ALTER TABLE words ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE words ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE words ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE words ADD COLUMN IF NOT EXISTS country_code text;

-- Index for the auto-purge query (find old IPs to null out)
CREATE INDEX IF NOT EXISTS idx_words_ip_purge 
  ON words (created_at) 
  WHERE ip_address IS NOT NULL;

-- Index for map queries (only rows with coordinates)
CREATE INDEX IF NOT EXISTS idx_words_geo 
  ON words (latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Scheduled function to purge IP addresses older than 30 days
-- Run this via pg_cron or Supabase scheduled functions
CREATE OR REPLACE FUNCTION purge_old_ip_addresses()
RETURNS integer AS $$
DECLARE
  purged integer;
BEGIN
  UPDATE words 
  SET ip_address = NULL 
  WHERE ip_address IS NOT NULL 
    AND created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS purged = ROW_COUNT;
  RETURN purged;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS: Allow the new columns to be inserted by authenticated users
-- (The existing RLS policy on words should cover this since we're adding columns, 
--  not changing the table's RLS policies)

COMMENT ON COLUMN words.ip_address IS 'Client IP address, auto-purged after 30 days';
COMMENT ON COLUMN words.latitude IS 'Approximate latitude derived from IP (rounded to ~1km)';
COMMENT ON COLUMN words.longitude IS 'Approximate longitude derived from IP (rounded to ~1km)';
COMMENT ON COLUMN words.city IS 'Approximate city name derived from IP geolocation';
COMMENT ON COLUMN words.country_code IS 'ISO country code derived from IP geolocation';

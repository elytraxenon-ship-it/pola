-- ==============================================================================
-- POLA DATABASE STEP 5: STRICT LOCATION CONSTRAINT & TRIGGER
-- Run this in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Ensure any old single 'کوردستان' or invalid location is updated to 'هەولێر، کوردستان'
UPDATE public.profiles
SET location = 'هەولێر، کوردستان'
WHERE location = 'کوردستان' 
   OR location = 'كوردستان' 
   OR location IS NULL 
   OR location = ''
   OR location ~ '[a-zA-Z]';

-- 2. Update default location column value to 'هەولێر، کوردستان'
ALTER TABLE public.profiles
  ALTER COLUMN location SET DEFAULT 'هەولێر، کوردستان';

-- 3. Drop existing constraint if present
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS check_location_format;

-- 4. Add strict CHECK constraint:
-- Must NOT contain Latin letters [a-zA-Z]
-- Must end with Kurdish or Arabic comma followed by کوردستان
ALTER TABLE public.profiles
  ADD CONSTRAINT check_location_format
  CHECK (
    location NOT ~ '[a-zA-Z0-9]' 
    AND location != 'کوردستان' 
    AND location != 'كوردستان'
    AND location ~ '^.+[،,]\s*(کوردستان|كوردستان)$'
  );

-- 5. Trigger Function for clear server-side database exception messages
CREATE OR REPLACE FUNCTION public.check_profile_location_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location IS NULL OR TRIM(NEW.location) = '' THEN
    NEW.location := 'هەولێر، کوردستان';
  ELSIF NEW.location ~ '[a-zA-Z]' THEN
    RAISE EXCEPTION 'Latin characters (%) are not allowed in location. Location must be Kurdish city name: "شار، کوردستان"', NEW.location;
  ELSIF NEW.location = 'کوردستان' OR NEW.location = 'كوردستان' THEN
    RAISE EXCEPTION 'Standalone "کوردستان" is not allowed. Format must be "شار، کوردستان"';
  ELSIF NOT (NEW.location ~ '^.+[،,]\s*(کوردستان|كوردستان)$') THEN
    RAISE EXCEPTION 'Invalid location format (%). Location must strictly follow "شار، کوردستان"', NEW.location;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profile_location_check ON public.profiles;
CREATE TRIGGER trg_profile_location_check
BEFORE INSERT OR UPDATE OF location ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_profile_location_trigger();

-- ==============================================================================
-- POLA DATABASE STEP 4: ADD ONBOARDING_COMPLETED FLAG
-- Run this in your Supabase Project -> SQL Editor
-- ==============================================================================

-- Add onboarding_completed flag to profiles (false = new user, needs onboarding)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false NOT NULL;

-- Index for fast new-user lookup
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);

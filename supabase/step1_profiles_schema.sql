-- ==============================================================================
-- POLA DATABASE STEP 1: PROFILES TABLE & AUTH TRIGGER
-- Run this in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Create the profiles table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sequential_id BIGSERIAL UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  cover_url TEXT DEFAULT 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?auto=format&fit=crop&w=1600&q=80',
  bio TEXT DEFAULT 'ئەندامی کۆمەڵگەی پۆلا',
  role TEXT DEFAULT 'داهێنەری نوێ',
  location TEXT DEFAULT 'کوردستان',
  website TEXT DEFAULT '',
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup by sequential_id (for ?page=profile&id=...)
CREATE INDEX IF NOT EXISTS idx_profiles_sequential_id ON public.profiles(sequential_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read of all profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Automatic Profile Creation on Google OAuth / User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_name text;
  v_avatar text;
  v_username text;
  v_clean_handle text;
BEGIN
  -- Extract name and avatar from Google OAuth metadata
  v_raw_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  );

  -- Generate username handle from email or name
  v_clean_handle := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  IF length(v_clean_handle) < 3 THEN
    v_clean_handle := 'user_' || substr(new.id::text, 1, 6);
  END IF;

  -- Ensure handle uniqueness
  v_username := v_clean_handle;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_username := v_clean_handle || '_' || floor(random() * 900 + 100)::text;
  END LOOP;

  -- Insert profile row
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url
  )
  VALUES (
    new.id,
    v_username,
    v_raw_name,
    v_avatar
  );

  RETURN new;
END;
$$;

-- Drop existing trigger if re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires immediately after a user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

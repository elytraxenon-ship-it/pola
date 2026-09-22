-- ==============================================================================
-- POLA DATABASE STEP 2: POSTS TABLE & POSTS COUNTER TRIGGER
-- Run this in your Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Create the posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  privacy TEXT DEFAULT 'public' CHECK (privacy IN ('public', 'friends', 'private')),
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fast indexing for feed and author queries
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN (tags);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read public posts
CREATE POLICY "Public posts are viewable by everyone"
ON public.posts FOR SELECT
USING (privacy = 'public');

-- Authenticated users can create posts where author_id matches their auth.uid()
CREATE POLICY "Users can create their own posts"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Authors can update their own posts
CREATE POLICY "Users can update their own posts"
ON public.posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Authors can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON public.posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id);

-- 3. Automatic posts_count Counter in public.profiles
CREATE OR REPLACE FUNCTION public.handle_post_count_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles
    SET posts_count = posts_count + 1
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles
    SET posts_count = GREATEST(posts_count - 1, 0)
    WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_post_added_or_deleted ON public.posts;
CREATE TRIGGER on_post_added_or_deleted
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_count_change();

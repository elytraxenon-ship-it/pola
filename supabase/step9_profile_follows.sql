-- Persistent, idempotent profile follows with transactional follower counters.
CREATE TABLE IF NOT EXISTS public.profile_follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT profile_follows_no_self CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_follows_following_id
  ON public.profile_follows(following_id, created_at DESC);

ALTER TABLE public.profile_follows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profile_follows FROM anon;
GRANT SELECT, INSERT, DELETE ON public.profile_follows TO authenticated;

DROP POLICY IF EXISTS "Users can view own follows" ON public.profile_follows;
CREATE POLICY "Users can view own follows" ON public.profile_follows
  FOR SELECT TO authenticated USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can follow as themselves" ON public.profile_follows;
CREATE POLICY "Users can follow as themselves" ON public.profile_follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow as themselves" ON public.profile_follows;
CREATE POLICY "Users can unfollow as themselves" ON public.profile_follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

CREATE OR REPLACE FUNCTION public.handle_profile_follow_count_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_follow_added_or_removed ON public.profile_follows;
CREATE TRIGGER on_profile_follow_added_or_removed
  AFTER INSERT OR DELETE ON public.profile_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_follow_count_change();

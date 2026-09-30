-- Persist per-user repost state and keep the aggregate count safe under concurrency.
CREATE TABLE IF NOT EXISTS public.post_reposts (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_reposts_post_id ON public.post_reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON public.post_comments(post_id, created_at DESC);

ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reposts" ON public.post_reposts;
CREATE POLICY "Users can view own reposts" ON public.post_reposts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own reposts" ON public.post_reposts;
CREATE POLICY "Users can create own reposts" ON public.post_reposts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own reposts" ON public.post_reposts;
CREATE POLICY "Users can remove own reposts" ON public.post_reposts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_repost_count_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET shares_count = GREATEST(shares_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_repost_added_or_removed ON public.post_reposts;
CREATE TRIGGER on_repost_added_or_removed
  AFTER INSERT OR DELETE ON public.post_reposts
  FOR EACH ROW EXECUTE FUNCTION public.handle_repost_count_change();

CREATE OR REPLACE FUNCTION public.notify_on_post_repost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id UUID;
BEGIN
  SELECT author_id INTO v_author_id FROM public.posts WHERE id = NEW.post_id;
  IF v_author_id IS NOT NULL AND v_author_id <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_type, entity_id, content)
    VALUES (v_author_id, NEW.user_id, 'spark', 'post', NEW.post_id, 'پۆستەکەت دووبارە بڵاوکرایەوە 🔁');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_post_repost ON public.post_reposts;
CREATE TRIGGER trg_notify_post_repost
  AFTER INSERT ON public.post_reposts
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_post_repost();

-- Stories are visible until the exact expires_at timestamp (24 hours after creation).
-- No scheduler is needed for expiry: all reads and media requests enforce this column.
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  caption TEXT NOT NULL DEFAULT ''
);

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS caption TEXT NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.stories'::regclass
      AND conname = 'stories_caption_length_check'
  ) THEN
    ALTER TABLE public.stories
      ADD CONSTRAINT stories_caption_length_check CHECK (char_length(caption) <= 280);
  END IF;
END;
$$;

-- timestamptz + interval is considered timezone-dependent by PostgreSQL, so it
-- cannot be used in a generated expression. Support rerunning an earlier draft
-- of this migration by converting its generated column to a normal column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = 'public.stories'::regclass
      AND attname = 'expires_at'
      AND attgenerated <> ''
      AND NOT attisdropped
  ) THEN
    ALTER TABLE public.stories ALTER COLUMN expires_at DROP EXPRESSION;
  END IF;
END;
$$;

-- Backfill rows if this migration was partially applied before being rerun.
UPDATE public.stories SET expires_at = created_at + INTERVAL '24 hours';
ALTER TABLE public.stories ALTER COLUMN expires_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS stories_expiration_feed_idx
  ON public.stories (expires_at, created_at DESC);
CREATE INDEX IF NOT EXISTS stories_owner_expiration_idx
  ON public.stories (user_id, expires_at DESC);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active stories are public" ON public.stories;
CREATE POLICY "Active stories are public"
  ON public.stories FOR SELECT
  TO anon, authenticated
  USING (expires_at > now());

DROP POLICY IF EXISTS "Users create their own stories" ON public.stories;
CREATE POLICY "Users create their own stories"
  ON public.stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their own stories" ON public.stories;
CREATE POLICY "Users delete their own stories"
  ON public.stories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.stories TO anon, authenticated;
GRANT INSERT, DELETE ON public.stories TO authenticated;

-- Serialize story creation for each user and cap active stories, preventing
-- parallel uploads from bypassing the storage guard. Expired rows do not count.
CREATE OR REPLACE FUNCTION public.enforce_active_story_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Compute expiry in a trigger (where timestamptz arithmetic is permitted).
  -- Overwrite client input so every story lives for exactly 24 hours.
  NEW.expires_at := NEW.created_at + INTERVAL '24 hours';

  -- Opportunistically trim old metadata in small, indexed batches. Expired
  -- media is separately reclaimed by the R2 lifecycle rule for stories/.
  DELETE FROM public.stories
  WHERE id IN (
    SELECT id FROM public.stories
    WHERE expires_at <= now()
    ORDER BY expires_at
    LIMIT 50
    FOR UPDATE SKIP LOCKED
  );

  PERFORM id FROM public.profiles WHERE id = NEW.user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'STORY_PROFILE_NOT_FOUND' USING ERRCODE = '23503';
  END IF;

  IF (
    SELECT count(*)
    FROM public.stories
    WHERE user_id = NEW.user_id AND expires_at > now()
  ) >= 20 THEN
    RAISE EXCEPTION 'ACTIVE_STORY_LIMIT' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_active_story_limit ON public.stories;
CREATE TRIGGER enforce_active_story_limit
  BEFORE INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_active_story_limit();

REVOKE ALL ON FUNCTION public.enforce_active_story_limit() FROM PUBLIC, anon, authenticated;

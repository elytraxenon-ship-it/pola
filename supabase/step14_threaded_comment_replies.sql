-- Add one-level replies to post comments. Reply rows remain in post_comments,
-- so existing moderation, RLS, and comment-count triggers continue to apply.
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID
  REFERENCES public.post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS post_comments_thread_order_idx
  ON public.post_comments (post_id, parent_comment_id, created_at ASC);

CREATE OR REPLACE FUNCTION public.validate_post_comment_parent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_post_id UUID;
  v_parent_id UUID;
BEGIN
  IF NEW.parent_comment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT post_id, parent_comment_id
  INTO v_parent_post_id, v_parent_id
  FROM public.post_comments
  WHERE id = NEW.parent_comment_id
  FOR KEY SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'COMMENT_PARENT_NOT_FOUND' USING ERRCODE = '23503';
  END IF;
  IF v_parent_post_id <> NEW.post_id THEN
    RAISE EXCEPTION 'COMMENT_PARENT_POST_MISMATCH' USING ERRCODE = '23514';
  END IF;
  IF v_parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'COMMENT_REPLIES_MUST_TARGET_ROOT' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_post_comment_parent ON public.post_comments;
CREATE TRIGGER validate_post_comment_parent
  BEFORE INSERT OR UPDATE OF post_id, parent_comment_id
  ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.validate_post_comment_parent();

REVOKE ALL ON FUNCTION public.validate_post_comment_parent() FROM PUBLIC, anon, authenticated;

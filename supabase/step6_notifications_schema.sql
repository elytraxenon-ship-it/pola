-- ==============================================================================
-- POLA DATABASE STEP 6: NOTIFICATIONS SCHEMA, RLS & SMART ANTI-SPAM TRIGGERS
-- Run this script in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('flame', 'comment', 'spark', 'invite')),
  entity_type  TEXT CHECK (entity_type IN ('post', 'comment', 'profile')),
  entity_id    UUID,
  content      TEXT,
  read         BOOLEAN DEFAULT false NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Performance & Deduplication Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient 
  ON public.notifications(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON public.notifications(recipient_id, read) 
  WHERE NOT read;

CREATE INDEX IF NOT EXISTS idx_notifications_dedup 
  ON public.notifications(recipient_id, actor_id, type, entity_id, created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Recipients can read their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
  ON public.notifications 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = recipient_id);

-- Recipients can mark their own notifications as read
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
  ON public.notifications 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Recipients can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" 
  ON public.notifications 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = recipient_id);

-- 4. Enable Supabase Realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Realtime publication might already include all tables or be managed by Supabase dashboard
  NULL;
END;
$$;

-- ==============================================================================
-- 5. SMART ANTI-SPAM TRIGGERS
-- ==============================================================================

-- A. LIKE TRIGGER:
-- Rules:
-- 1. Actor != Recipient (Never notify yourself)
-- 2. 24-hour Dedup (Avoid notification spam if a user unlikes & re-likes the same post)
CREATE OR REPLACE FUNCTION public.notify_on_post_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id UUID;
BEGIN
  -- Get post author
  SELECT author_id INTO v_recipient_id FROM public.posts WHERE id = NEW.post_id;

  -- Rule 1: Skip if user liked their own post or post author not found
  IF v_recipient_id IS NULL OR NEW.user_id = v_recipient_id THEN
    RETURN NEW;
  END IF;

  -- Rule 2: Skip if same user already notified for liking this same post within last 24 hours
  IF EXISTS (
    SELECT 1 FROM public.notifications
    WHERE recipient_id = v_recipient_id
      AND actor_id = NEW.user_id
      AND type = 'flame'
      AND entity_id = NEW.post_id
      AND created_at > now() - INTERVAL '24 hours'
  ) THEN
    RETURN NEW;
  END IF;

  -- Insert clean notification
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    content
  ) VALUES (
    v_recipient_id,
    NEW.user_id,
    'flame',
    'post',
    NEW.post_id,
    'دەنگدانەوەی گەرمی بۆ ساتەکەت تۆمار کرد'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_post_like ON public.post_likes;
CREATE TRIGGER trg_notify_post_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_post_like();


-- B. COMMENT TRIGGER:
-- Rules:
-- 1. Actor != Recipient (Never notify yourself)
-- 2. 10-Minute Cooldown (If user writes multiple quick comments on same post, don't spam 10 notifications)
CREATE OR REPLACE FUNCTION public.notify_on_post_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id UUID;
BEGIN
  -- Get post author
  SELECT author_id INTO v_recipient_id FROM public.posts WHERE id = NEW.post_id;

  -- Rule 1: Skip if author commented on their own post
  IF v_recipient_id IS NULL OR NEW.author_id = v_recipient_id THEN
    RETURN NEW;
  END IF;

  -- Rule 2: 10-minute cooldown per actor+post to prevent comment bombing
  IF EXISTS (
    SELECT 1 FROM public.notifications
    WHERE recipient_id = v_recipient_id
      AND actor_id = NEW.author_id
      AND type = 'comment'
      AND entity_id = NEW.post_id
      AND created_at > now() - INTERVAL '10 minutes'
  ) THEN
    RETURN NEW;
  END IF;

  -- Insert clean notification
  INSERT INTO public.notifications (
    recipient_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    content
  ) VALUES (
    v_recipient_id,
    NEW.author_id,
    'comment',
    'post',
    NEW.post_id,
    'لێدوانێکی نوێی لەسەر ساتەکەت نووسی'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_post_comment ON public.post_comments;
CREATE TRIGGER trg_notify_post_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_post_comment();

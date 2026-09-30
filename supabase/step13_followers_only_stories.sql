-- Stories are visible only to their owner and authenticated followers.
-- The follows table and its self-read policy are created in step9.
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active stories are public" ON public.stories;
DROP POLICY IF EXISTS "Followers can view active stories" ON public.stories;
CREATE POLICY "Followers can view active stories"
  ON public.stories FOR SELECT
  TO authenticated
  USING (
    expires_at > now()
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.profile_follows AS follows
        WHERE follows.follower_id = auth.uid()
          AND follows.following_id = stories.user_id
      )
    )
  );

REVOKE SELECT ON public.stories FROM anon;
GRANT SELECT ON public.stories TO authenticated;

-- Shared database-backed limits for authenticated follow and unfollow actions.
-- Each user gets a 20-action token bucket refilling at 20/minute plus 200 accepted
-- follow/unfollow mutations per UTC day. A row lock makes concurrent calls atomic.
CREATE TABLE IF NOT EXISTS public.profile_follow_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tokens_remaining NUMERIC(8, 6) NOT NULL DEFAULT 20,
  last_refill_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  day_bucket TIMESTAMPTZ NOT NULL,
  day_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_follow_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profile_follow_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_profile_follow_rate_limit()
RETURNS TABLE(
  allowed BOOLEAN,
  retry_after_seconds INTEGER,
  remaining_minute INTEGER,
  remaining_day INTEGER,
  active_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := now();
  v_day_bucket TIMESTAMPTZ := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_limit_row public.profile_follow_rate_limits%ROWTYPE;
  v_refilled_tokens NUMERIC(8, 6);
  v_day_count INTEGER;
  v_remaining_minute INTEGER;
  v_retry_after INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.profile_follow_rate_limits (user_id, tokens_remaining, last_refill_at, day_bucket, day_count, updated_at)
  VALUES (v_user_id, 20, v_now, v_day_bucket, 0, v_now)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_limit_row
  FROM public.profile_follow_rate_limits
  WHERE user_id = v_user_id
  FOR UPDATE;

  v_refilled_tokens := LEAST(
    20::NUMERIC,
    v_limit_row.tokens_remaining + GREATEST(EXTRACT(EPOCH FROM (v_now - v_limit_row.last_refill_at)), 0) * (20.0 / 60.0)
  );
  v_day_count := CASE WHEN v_limit_row.day_bucket < v_day_bucket THEN 0 ELSE v_limit_row.day_count END;
  v_remaining_minute := GREATEST(FLOOR(v_refilled_tokens)::INTEGER, 0);

  IF v_day_count >= 200 THEN
    v_retry_after := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_day_bucket + INTERVAL '1 day' - v_now)))::INTEGER);
    UPDATE public.profile_follow_rate_limits
      SET tokens_remaining = v_refilled_tokens, last_refill_at = v_now,
          day_bucket = v_day_bucket, day_count = v_day_count, updated_at = v_now
      WHERE user_id = v_user_id;
    RETURN QUERY SELECT FALSE, v_retry_after, v_remaining_minute, 0, 200;
  ELSIF v_refilled_tokens < 1 THEN
    v_retry_after := GREATEST(1, CEIL((1 - v_refilled_tokens) / (20.0 / 60.0))::INTEGER);
    UPDATE public.profile_follow_rate_limits
      SET tokens_remaining = v_refilled_tokens, last_refill_at = v_now,
          day_bucket = v_day_bucket, day_count = v_day_count, updated_at = v_now
      WHERE user_id = v_user_id;
    RETURN QUERY SELECT FALSE, v_retry_after, 0, GREATEST(200 - v_day_count, 0), 20;
  ELSE
    v_refilled_tokens := v_refilled_tokens - 1;
    v_day_count := v_day_count + 1;
    v_retry_after := CASE
      WHEN v_refilled_tokens >= 20 THEN 0
      ELSE GREATEST(1, CEIL((20 - v_refilled_tokens) / (20.0 / 60.0))::INTEGER)
    END;
    UPDATE public.profile_follow_rate_limits
      SET tokens_remaining = v_refilled_tokens, last_refill_at = v_now,
          day_bucket = v_day_bucket, day_count = v_day_count, updated_at = v_now
      WHERE user_id = v_user_id;
    RETURN QUERY SELECT TRUE, v_retry_after, FLOOR(v_refilled_tokens)::INTEGER, GREATEST(200 - v_day_count, 0), 20;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_profile_follow_rate_limit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_profile_follow_rate_limit() TO authenticated;

-- Search abuse protection shared across all application instances.
-- The API hashes user IDs/IP addresses with a server-only HMAC secret before
-- calling the service-role-only RPC; raw IP addresses are not persisted.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS profiles_username_search_idx
  ON public.profiles USING GIN (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_full_name_search_idx
  ON public.profiles USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS posts_public_content_search_idx
  ON public.posts USING GIN (content gin_trgm_ops)
  WHERE privacy = 'public';

CREATE TABLE IF NOT EXISTS public.search_rate_limits (
  identity_hash TEXT PRIMARY KEY CHECK (identity_hash ~ '^[a-f0-9]{64}$'),
  tokens_remaining NUMERIC(8, 6) NOT NULL,
  last_refill_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  day_bucket DATE NOT NULL,
  day_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_rate_limits_updated_at_idx
  ON public.search_rate_limits (updated_at);

ALTER TABLE public.search_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.search_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_search_rate_limit(
  p_identity_hash TEXT,
  p_is_authenticated BOOLEAN
)
RETURNS TABLE(
  allowed BOOLEAN,
  retry_after_seconds INTEGER,
  remaining_minute INTEGER,
  remaining_day INTEGER,
  active_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_day DATE := (now() AT TIME ZONE 'UTC')::date;
  v_capacity NUMERIC := CASE WHEN p_is_authenticated THEN 30 ELSE 15 END;
  v_refill_per_second NUMERIC := CASE WHEN p_is_authenticated THEN 0.5 ELSE 0.25 END;
  v_daily_limit INTEGER := CASE WHEN p_is_authenticated THEN 1200 ELSE 300 END;
  v_row public.search_rate_limits%ROWTYPE;
  v_tokens NUMERIC;
  v_day_count INTEGER;
  v_remaining_minute INTEGER;
  v_retry INTEGER;
BEGIN
  IF p_identity_hash IS NULL OR p_identity_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid search rate limit identity' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.search_rate_limits
    (identity_hash, tokens_remaining, last_refill_at, day_bucket, day_count, updated_at)
  VALUES
    (p_identity_hash, v_capacity, v_now, v_day, 0, v_now)
  ON CONFLICT (identity_hash) DO NOTHING;

  SELECT * INTO v_row
  FROM public.search_rate_limits
  WHERE identity_hash = p_identity_hash
  FOR UPDATE;

  v_tokens := LEAST(
    v_capacity,
    v_row.tokens_remaining
      + GREATEST(EXTRACT(EPOCH FROM (v_now - v_row.last_refill_at)), 0) * v_refill_per_second
  );
  v_day_count := CASE WHEN v_row.day_bucket < v_day THEN 0 ELSE v_row.day_count END;
  v_remaining_minute := GREATEST(FLOOR(v_tokens)::INTEGER, 0);

  IF v_day_count >= v_daily_limit THEN
    v_retry := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (((v_day + 1)::timestamp AT TIME ZONE 'UTC') - v_now)))::INTEGER);
    UPDATE public.search_rate_limits SET
      tokens_remaining = v_tokens, last_refill_at = v_now,
      day_bucket = v_day, day_count = v_day_count, updated_at = v_now
      WHERE identity_hash = p_identity_hash;
    RETURN QUERY SELECT FALSE, v_retry, v_remaining_minute, 0, v_capacity::INTEGER;
  ELSIF v_tokens < 1 THEN
    v_retry := GREATEST(1, CEIL((1 - v_tokens) / v_refill_per_second)::INTEGER);
    UPDATE public.search_rate_limits SET
      tokens_remaining = v_tokens, last_refill_at = v_now,
      day_bucket = v_day, day_count = v_day_count, updated_at = v_now
      WHERE identity_hash = p_identity_hash;
    RETURN QUERY SELECT FALSE, v_retry, 0, GREATEST(v_daily_limit - v_day_count, 0), v_capacity::INTEGER;
  ELSE
    v_tokens := v_tokens - 1;
    v_day_count := v_day_count + 1;
    v_retry := CASE
      WHEN v_tokens >= v_capacity THEN 0
      ELSE GREATEST(1, CEIL((v_capacity - v_tokens) / v_refill_per_second)::INTEGER)
    END;
    UPDATE public.search_rate_limits SET
      tokens_remaining = v_tokens, last_refill_at = v_now,
      day_bucket = v_day, day_count = v_day_count, updated_at = v_now
      WHERE identity_hash = p_identity_hash;
    RETURN QUERY SELECT TRUE, v_retry, FLOOR(v_tokens)::INTEGER,
      GREATEST(v_daily_limit - v_day_count, 0), v_capacity::INTEGER;
  END IF;

  -- Bound stale identity storage without requiring a scheduled cleanup job.
  IF random() < 0.01 THEN
    DELETE FROM public.search_rate_limits
    WHERE identity_hash IN (
      SELECT identity_hash FROM public.search_rate_limits
      WHERE updated_at < v_now - INTERVAL '30 days'
      ORDER BY updated_at LIMIT 500
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_search_rate_limit(TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_search_rate_limit(TEXT, BOOLEAN) TO service_role;

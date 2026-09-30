-- One indexed RPC supplies a bounded public media gallery and the creator's
-- actual lifetime like total for profile pages.
CREATE OR REPLACE FUNCTION public.get_profile_media_metrics(p_profile_id UUID)
RETURNS TABLE(media JSONB, resonance_count BIGINT)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', gallery.id,
        'url', gallery.media_url,
        'created_at', gallery.created_at
      ) ORDER BY gallery.created_at DESC)
      FROM (
        SELECT id, media_url, created_at
        FROM public.posts
        WHERE author_id = p_profile_id
          AND privacy = 'public'
          AND media_url IS NOT NULL
          AND media_url !~* '[.](mp4|webm|ogg|mov|mkv)([?].*)?$'
          AND media_url NOT ILIKE 'data:video/%'
        ORDER BY created_at DESC
        LIMIT 24
      ) AS gallery
    ), '[]'::jsonb),
    COALESCE((
      SELECT SUM(likes_count)::BIGINT
      FROM public.posts
      WHERE author_id = p_profile_id AND privacy = 'public'
    ), 0)::BIGINT;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_media_metrics(UUID) TO anon, authenticated;

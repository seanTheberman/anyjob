-- Level 1 is the first provider level badge. It should be awarded only after
-- five real completed jobs, not from seeded seller.total_jobs counters.

CREATE OR REPLACE FUNCTION public.badge_metric_value(target_user_id UUID, target_role TEXT, metric_name TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  value NUMERIC := 0;
BEGIN
  IF target_user_id IS NULL THEN
    RETURN 0;
  END IF;

  IF target_role = 'provider' THEN
    CASE metric_name
      WHEN 'completed_jobs' THEN
        SELECT
          COALESCE((
            SELECT COUNT(*)
            FROM public.bids b
            JOIN public.service_inquiries si ON si.id = b.inquiry_id
            WHERE b.provider_id = target_user_id
              AND b.status = 'accepted'
              AND si.status IN ('completed', 'converted', 'reviewed')
          ), 0)
          + COALESCE((
            SELECT COUNT(*)
            FROM public.eloo_bookings eb
            WHERE eb.provider_id = target_user_id
              AND eb.status IN ('completed', 'converted', 'reviewed')
          ), 0)
          + COALESCE((
            SELECT COUNT(*)
            FROM public.shift_applications sa
            WHERE sa.provider_user_id = target_user_id
              AND sa.status = 'completed'
          ), 0)
        INTO value;
      WHEN 'average_rating' THEN
        SELECT COALESCE(AVG(rating), 0)
        INTO value
        FROM public.eloo_reviews
        WHERE reviewee_id = target_user_id
          AND is_public = TRUE
          AND booking_id IS NOT NULL;
      WHEN 'review_count' THEN
        SELECT COALESCE(COUNT(*), 0)
        INTO value
        FROM public.eloo_reviews
        WHERE reviewee_id = target_user_id
          AND is_public = TRUE
          AND booking_id IS NOT NULL;
      WHEN 'total_earnings' THEN
        SELECT COALESCE(SUM(CASE WHEN status IN ('completed', 'converted', 'reviewed') THEN total_price ELSE 0 END), 0)
        INTO value
        FROM public.eloo_bookings
        WHERE provider_id = target_user_id;
      WHEN 'cancelled_jobs' THEN
        SELECT COALESCE(COUNT(*) FILTER (WHERE status = 'cancelled'), 0)
        INTO value
        FROM public.eloo_bookings
        WHERE provider_id = target_user_id;
      WHEN 'verified_provider' THEN
        SELECT CASE WHEN EXISTS (
          SELECT 1 FROM public.sellers WHERE id = target_user_id AND status = 'approved'
        ) OR EXISTS (
          SELECT 1 FROM public.eloo_profiles WHERE id = target_user_id AND is_verified = TRUE
        ) THEN 1 ELSE 0 END
        INTO value;
      WHEN 'kyc_verified' THEN
        SELECT CASE WHEN EXISTS (
          SELECT 1 FROM public.eloo_profiles WHERE id = target_user_id AND is_verified = TRUE
        ) THEN 1 ELSE 0 END
        INTO value;
      WHEN 'account_age_days' THEN
        SELECT COALESCE(EXTRACT(DAY FROM NOW() - MIN(created_at)), 0)
        INTO value
        FROM (
          SELECT created_at FROM public.sellers WHERE id = target_user_id
          UNION ALL
          SELECT created_at FROM public.eloo_profiles WHERE id = target_user_id
        ) account_rows;
      ELSE
        value := 0;
    END CASE;
  ELSE
    CASE metric_name
      WHEN 'jobs_posted' THEN
        SELECT COALESCE(COUNT(*), 0)
        INTO value
        FROM public.service_inquiries
        WHERE user_id = target_user_id;
      WHEN 'hired_jobs' THEN
        SELECT GREATEST(
          COALESCE((SELECT COUNT(*) FROM public.service_inquiries WHERE user_id = target_user_id AND status IN ('bid_accepted', 'converted')), 0),
          COALESCE((SELECT COUNT(*) FROM public.eloo_bookings WHERE client_id = target_user_id AND status IN ('confirmed', 'in_progress', 'completed')), 0)
        )
        INTO value;
      WHEN 'paid_jobs' THEN
        SELECT COALESCE(COUNT(*), 0)
        INTO value
        FROM public.eloo_bookings
        WHERE client_id = target_user_id
          AND (is_paid = TRUE OR status IN ('confirmed', 'in_progress', 'completed'));
      WHEN 'total_spent' THEN
        SELECT COALESCE(SUM(total_price), 0)
        INTO value
        FROM public.eloo_bookings
        WHERE client_id = target_user_id
          AND (is_paid = TRUE OR status IN ('confirmed', 'in_progress', 'completed'));
      WHEN 'payment_verified' THEN
        SELECT CASE WHEN EXISTS (
          SELECT 1
          FROM public.eloo_bookings
          WHERE client_id = target_user_id
            AND (is_paid = TRUE OR status IN ('confirmed', 'in_progress', 'completed'))
        ) THEN 1 ELSE 0 END
        INTO value;
      WHEN 'kyc_verified' THEN
        SELECT CASE WHEN EXISTS (
          SELECT 1 FROM public.buyers WHERE id = target_user_id AND kyc_status = 'approved'
        ) OR EXISTS (
          SELECT 1 FROM public.eloo_profiles WHERE id = target_user_id AND is_verified = TRUE
        ) THEN 1 ELSE 0 END
        INTO value;
      WHEN 'account_age_days' THEN
        SELECT COALESCE(EXTRACT(DAY FROM NOW() - MIN(created_at)), 0)
        INTO value
        FROM (
          SELECT created_at FROM public.buyers WHERE id = target_user_id
          UNION ALL
          SELECT created_at FROM public.eloo_profiles WHERE id = target_user_id
        ) account_rows;
      ELSE
        value := 0;
    END CASE;
  END IF;

  RETURN COALESCE(value, 0);
END;
$function$;

DO $$
DECLARE
  v_level_one_id UUID;
BEGIN
  SELECT id INTO v_level_one_id
  FROM public.badge_definitions
  WHERE name = 'Level 1' OR slug LIKE 'level-1%'
  ORDER BY created_at NULLS LAST
  LIMIT 1;

  IF v_level_one_id IS NULL THEN
    INSERT INTO public.badge_definitions (slug, name, description, icon, color, audience, award_type, is_active, is_public, sort_order)
    VALUES ('level-1', 'Level 1', 'Provider has completed at least five real jobs on AnyJob.', 'Award', 'blue', 'provider', 'automatic', TRUE, TRUE, 50)
    RETURNING id INTO v_level_one_id;
  ELSE
    UPDATE public.badge_definitions
    SET
      name = 'Level 1',
      description = 'Provider has completed at least five real jobs on AnyJob.',
      audience = 'provider',
      award_type = 'automatic',
      is_active = TRUE,
      is_public = TRUE,
      sort_order = 50
    WHERE id = v_level_one_id;
  END IF;

  DELETE FROM public.badge_rules
  WHERE badge_id = v_level_one_id;

  INSERT INTO public.badge_rules (badge_id, metric, operator, threshold)
  VALUES (v_level_one_id, 'completed_jobs', 'gte', 5);
END $$;

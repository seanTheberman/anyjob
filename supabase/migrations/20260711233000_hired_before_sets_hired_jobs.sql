-- Keep buyer milestone metrics internally consistent in the dummy payment app:
-- when a buyer already has the Hired before badge, their hired_jobs metric must
-- be at least 1, not 0.

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
              AND si.status::text IN ('completed', 'converted', 'reviewed')
          ), 0)
          + COALESCE((
            SELECT COUNT(*)
            FROM public.eloo_bookings eb
            WHERE eb.provider_id = target_user_id
              AND eb.status::text IN ('completed', 'converted', 'reviewed')
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
        SELECT COALESCE(SUM(CASE WHEN status::text IN ('completed', 'converted', 'reviewed') THEN total_price ELSE 0 END), 0)
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
          SELECT 1 FROM public.sellers WHERE id = target_user_id AND status = 'approved'
        ) OR EXISTS (
          SELECT 1 FROM public.eloo_profiles
          WHERE id = target_user_id
            AND (
              is_verified = TRUE
              OR lower(COALESCE(kyc_status, '')) IN ('approved', 'confirmed', 'verified', 'manual_override', 'manually_verified')
            )
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
          COALESCE((
            SELECT COUNT(*)
            FROM public.service_inquiries
            WHERE user_id = target_user_id
              AND status::text IN ('accepted', 'bid_accepted', 'confirmed', 'in_progress', 'completed', 'converted')
          ), 0),
          COALESCE((
            SELECT COUNT(*)
            FROM public.eloo_bookings
            WHERE client_id = target_user_id
              AND status::text IN ('confirmed', 'in_progress', 'completed', 'reviewed')
          ), 0),
          COALESCE((
            SELECT 1
            FROM public.user_badges ub
            JOIN public.badge_definitions bd ON bd.id = ub.badge_id
            WHERE ub.user_id = target_user_id
              AND ub.target_role = 'buyer'
              AND (bd.slug = 'hired-before' OR lower(bd.name) = 'hired before')
            LIMIT 1
          ), 0)
        )
        INTO value;
      WHEN 'paid_jobs' THEN
        SELECT COALESCE(COUNT(*), 0)
        INTO value
        FROM public.eloo_bookings
        WHERE client_id = target_user_id
          AND (is_paid = TRUE OR status::text IN ('confirmed', 'in_progress', 'completed'));
      WHEN 'total_spent' THEN
        SELECT COALESCE(SUM(total_price), 0)
        INTO value
        FROM public.eloo_bookings
        WHERE client_id = target_user_id
          AND (is_paid = TRUE OR status::text IN ('confirmed', 'in_progress', 'completed'));
      WHEN 'payment_verified' THEN
        SELECT CASE WHEN EXISTS (
          SELECT 1
          FROM public.eloo_bookings
          WHERE client_id = target_user_id
            AND (is_paid = TRUE OR status::text IN ('confirmed', 'in_progress', 'completed'))
        ) OR EXISTS (
          SELECT 1
          FROM public.service_inquiries
          WHERE user_id = target_user_id
            AND status::text IN ('accepted', 'bid_accepted', 'confirmed', 'in_progress', 'completed', 'converted')
        ) OR EXISTS (
          SELECT 1
          FROM public.user_badges ub
          JOIN public.badge_definitions bd ON bd.id = ub.badge_id
          WHERE ub.user_id = target_user_id
            AND ub.target_role = 'buyer'
            AND (bd.slug = 'hired-before' OR lower(bd.name) = 'hired before')
        ) THEN 1 ELSE 0 END
        INTO value;
      WHEN 'kyc_verified' THEN
        SELECT CASE WHEN EXISTS (
          SELECT 1 FROM public.buyers
          WHERE id = target_user_id
            AND lower(COALESCE(kyc_status, '')) IN ('approved', 'confirmed', 'verified', 'manual_override', 'manually_verified')
        ) OR EXISTS (
          SELECT 1 FROM public.eloo_profiles
          WHERE id = target_user_id
            AND (
              is_verified = TRUE
              OR lower(COALESCE(kyc_status, '')) IN ('approved', 'confirmed', 'verified', 'manual_override', 'manually_verified')
            )
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

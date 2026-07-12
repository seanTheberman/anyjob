-- Rule-created badges should reflect current rule metrics. Older automation
-- awarded provider level badges from seeded sellers.total_jobs values, and the
-- sync function never revoked badges after the metric logic was corrected.

CREATE OR REPLACE FUNCTION public.sync_user_badges_for_user(p_target_user_id UUID, p_target_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  badge RECORD;
  qualifies BOOLEAN;
  new_user_badge_id UUID;
  revoked_user_badge_id UUID;
BEGIN
  IF p_target_user_id IS NULL OR p_target_role NOT IN ('provider', 'buyer') THEN
    RETURN;
  END IF;

  FOR badge IN
    SELECT bd.id, bd.audience, bd.award_type
    FROM public.badge_definitions bd
    WHERE bd.is_active = TRUE
      AND bd.award_type IN ('automatic', 'system')
      AND bd.audience IN (p_target_role, 'all')
      AND EXISTS (SELECT 1 FROM public.badge_rules br WHERE br.badge_id = bd.id)
  LOOP
    SELECT COALESCE(BOOL_AND(
      CASE br.operator
        WHEN 'gte' THEN public.badge_metric_value(p_target_user_id, p_target_role, br.metric) >= br.threshold
        WHEN 'lte' THEN public.badge_metric_value(p_target_user_id, p_target_role, br.metric) <= br.threshold
        ELSE public.badge_metric_value(p_target_user_id, p_target_role, br.metric) = br.threshold
      END
    ), FALSE)
    INTO qualifies
    FROM public.badge_rules br
    WHERE br.badge_id = badge.id;

    new_user_badge_id := NULL;
    revoked_user_badge_id := NULL;

    IF qualifies THEN
      INSERT INTO public.user_badges (user_id, badge_id, target_role, award_type, awarded_reason, source)
      VALUES (p_target_user_id, badge.id, p_target_role, badge.award_type, 'Automatic rule requirements met', 'rule')
      ON CONFLICT (user_id, badge_id, target_role) DO NOTHING
      RETURNING id INTO new_user_badge_id;

      IF p_target_role = 'provider' THEN
        INSERT INTO public.provider_badges (provider_id, badge_id, awarded_reason)
        VALUES (p_target_user_id, badge.id, 'Automatic rule requirements met')
        ON CONFLICT (provider_id, badge_id) DO NOTHING;
      END IF;

      IF new_user_badge_id IS NOT NULL THEN
        INSERT INTO public.badge_award_events (user_badge_id, user_id, badge_id, target_role, event_type, reason, metadata)
        VALUES (new_user_badge_id, p_target_user_id, badge.id, p_target_role, 'awarded', 'Automatic rule requirements met', jsonb_build_object('source', 'rule'));
      END IF;
    ELSE
      DELETE FROM public.user_badges ub
      WHERE ub.user_id = p_target_user_id
        AND ub.badge_id = badge.id
        AND ub.target_role = p_target_role
        AND ub.source = 'rule'
        AND ub.award_type IN ('automatic', 'system')
      RETURNING ub.id INTO revoked_user_badge_id;

      IF p_target_role = 'provider' THEN
        DELETE FROM public.provider_badges pb
        WHERE pb.provider_id = p_target_user_id
          AND pb.badge_id = badge.id
          AND COALESCE(pb.awarded_reason, '') = 'Automatic rule requirements met';
      END IF;

      IF revoked_user_badge_id IS NOT NULL THEN
        INSERT INTO public.badge_award_events (user_badge_id, user_id, badge_id, target_role, event_type, reason, metadata)
        VALUES (NULL, p_target_user_id, badge.id, p_target_role, 'revoked', 'Automatic rule requirements no longer met', jsonb_build_object('source', 'rule', 'revoked_user_badge_id', revoked_user_badge_id));
      END IF;
    END IF;
  END LOOP;
END;
$function$;

WITH duplicate_badges AS (
  SELECT id
  FROM public.badge_definitions
  WHERE slug = 'five-jobs-completed'
     OR lower(name) = '5 jobs completed'
)
DELETE FROM public.provider_badges pb
USING duplicate_badges db
WHERE pb.badge_id = db.id
  AND COALESCE(pb.awarded_reason, '') = 'Automatic rule requirements met';

WITH duplicate_badges AS (
  SELECT id
  FROM public.badge_definitions
  WHERE slug = 'five-jobs-completed'
     OR lower(name) = '5 jobs completed'
)
DELETE FROM public.user_badges ub
USING duplicate_badges db
WHERE ub.badge_id = db.id
  AND ub.source = 'rule'
  AND ub.award_type IN ('automatic', 'system');

UPDATE public.badge_definitions
SET
  is_active = FALSE,
  is_public = FALSE,
  description = 'Legacy duplicate hidden. Level 1 is the visible five-job provider milestone.',
  sort_order = 999
WHERE slug = 'five-jobs-completed'
   OR lower(name) = '5 jobs completed';

DO $$
DECLARE
  provider_row RECORD;
  buyer_row RECORD;
BEGIN
  FOR provider_row IN
    SELECT id FROM public.sellers
    UNION
    SELECT id FROM public.eloo_profiles WHERE role IN ('provider', 'seller')
  LOOP
    PERFORM public.sync_user_badges_for_user(provider_row.id, 'provider');
  END LOOP;

  FOR buyer_row IN
    SELECT id FROM public.buyers
    UNION
    SELECT id FROM public.eloo_profiles WHERE role = 'client'
  LOOP
    PERFORM public.sync_user_badges_for_user(buyer_row.id, 'buyer');
  END LOOP;
END $$;

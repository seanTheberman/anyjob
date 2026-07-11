CREATE OR REPLACE FUNCTION public.sync_user_badges_for_user(target_user_id UUID, target_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_target_user_id UUID := target_user_id;
  v_target_role TEXT := target_role;
  badge RECORD;
  qualifies BOOLEAN;
  new_user_badge_id UUID;
BEGIN
  IF v_target_user_id IS NULL OR v_target_role NOT IN ('provider', 'buyer') THEN
    RETURN;
  END IF;

  FOR badge IN
    SELECT bd.id, bd.audience, bd.award_type
    FROM public.badge_definitions bd
    WHERE bd.is_active = TRUE
      AND bd.award_type IN ('automatic', 'system')
      AND bd.audience IN (v_target_role, 'all')
      AND EXISTS (SELECT 1 FROM public.badge_rules br WHERE br.badge_id = bd.id)
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_badges ub
        WHERE ub.user_id = v_target_user_id
          AND ub.badge_id = bd.id
          AND ub.target_role = v_target_role
      )
  LOOP
    SELECT BOOL_AND(
      CASE br.operator
        WHEN 'gte' THEN public.badge_metric_value(v_target_user_id, v_target_role, br.metric) >= br.threshold
        WHEN 'lte' THEN public.badge_metric_value(v_target_user_id, v_target_role, br.metric) <= br.threshold
        ELSE public.badge_metric_value(v_target_user_id, v_target_role, br.metric) = br.threshold
      END
    )
    INTO qualifies
    FROM public.badge_rules br
    WHERE br.badge_id = badge.id;

    IF qualifies THEN
      INSERT INTO public.user_badges (user_id, badge_id, target_role, award_type, awarded_reason, source)
      VALUES (v_target_user_id, badge.id, v_target_role, badge.award_type, 'Automatic rule requirements met', 'rule')
      ON CONFLICT (user_id, badge_id, target_role) DO NOTHING
      RETURNING id INTO new_user_badge_id;

      IF v_target_role = 'provider' THEN
        INSERT INTO public.provider_badges (provider_id, badge_id, awarded_reason)
        VALUES (v_target_user_id, badge.id, 'Automatic rule requirements met')
        ON CONFLICT (provider_id, badge_id) DO NOTHING;
      END IF;

      IF new_user_badge_id IS NOT NULL THEN
        INSERT INTO public.badge_award_events (user_badge_id, user_id, badge_id, target_role, event_type, reason, metadata)
        VALUES (
          new_user_badge_id,
          v_target_user_id,
          badge.id,
          v_target_role,
          'awarded',
          'Automatic rule requirements met',
          jsonb_build_object('source', 'rule')
        );
      END IF;
    END IF;
  END LOOP;
END;
$function$;

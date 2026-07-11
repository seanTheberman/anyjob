-- Unified buyer/provider badge system with manual, random, and rule-based awards.

ALTER TABLE public.badge_definitions
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'provider',
  ADD COLUMN IF NOT EXISTS award_type TEXT NOT NULL DEFAULT 'automatic',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 100;

UPDATE public.badge_definitions
SET slug = lower(trim(both '-' from regexp_replace(name || '-' || left(id::text, 8), '[^a-zA-Z0-9]+', '-', 'g')))
WHERE slug IS NULL OR slug = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'badge_definitions_audience_check'
      AND conrelid = 'public.badge_definitions'::regclass
  ) THEN
    ALTER TABLE public.badge_definitions
      ADD CONSTRAINT badge_definitions_audience_check
      CHECK (audience IN ('provider', 'buyer', 'all'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'badge_definitions_award_type_check'
      AND conrelid = 'public.badge_definitions'::regclass
  ) THEN
    ALTER TABLE public.badge_definitions
      ADD CONSTRAINT badge_definitions_award_type_check
      CHECK (award_type IN ('automatic', 'manual', 'random', 'system'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_badge_definitions_slug ON public.badge_definitions(slug);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_audience ON public.badge_definitions(audience);

ALTER TABLE public.badge_rules DROP CONSTRAINT IF EXISTS badge_rules_metric_check;
ALTER TABLE public.badge_rules
  ADD CONSTRAINT badge_rules_metric_check
  CHECK (metric IN (
    'completed_jobs',
    'average_rating',
    'review_count',
    'total_earnings',
    'cancelled_jobs',
    'verified_provider',
    'jobs_posted',
    'hired_jobs',
    'paid_jobs',
    'total_spent',
    'payment_verified',
    'kyc_verified',
    'account_age_days'
  ));

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL CHECK (target_role IN ('provider', 'buyer')),
  award_type TEXT NOT NULL DEFAULT 'manual' CHECK (award_type IN ('automatic', 'manual', 'random', 'system')),
  awarded_by UUID REFERENCES auth.users(id),
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  awarded_reason TEXT,
  source TEXT NOT NULL DEFAULT 'admin',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, badge_id, target_role)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_role ON public.user_badges(user_id, target_role);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_awarded_at ON public.user_badges(awarded_at DESC);

CREATE TABLE IF NOT EXISTS public.badge_award_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_badge_id UUID REFERENCES public.user_badges(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  badge_id UUID REFERENCES public.badge_definitions(id) ON DELETE SET NULL,
  target_role TEXT CHECK (target_role IN ('provider', 'buyer')),
  event_type TEXT NOT NULL DEFAULT 'awarded',
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badge_award_events_user_id ON public.badge_award_events(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_award_events_created_at ON public.badge_award_events(created_at DESC);

GRANT SELECT ON public.badge_definitions TO anon, authenticated;
GRANT SELECT ON public.badge_rules TO anon, authenticated;
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.badge_definitions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.badge_rules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_badges TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_badges TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.badge_award_events TO service_role;

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_award_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view public awarded badges" ON public.user_badges;
CREATE POLICY "Public can view public awarded badges"
  ON public.user_badges FOR SELECT
  TO anon, authenticated
  USING (
    (expires_at IS NULL OR expires_at > NOW())
    AND EXISTS (
      SELECT 1
      FROM public.badge_definitions bd
      WHERE bd.id = user_badges.badge_id
        AND bd.is_active = TRUE
        AND bd.is_public = TRUE
    )
  )
;

DROP POLICY IF EXISTS "Service role can manage user badges" ON public.user_badges;
CREATE POLICY "Service role can manage user badges"
  ON public.user_badges FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage badge award events" ON public.badge_award_events;
CREATE POLICY "Service role can manage badge award events"
  ON public.badge_award_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.badge_metric_value(target_user_id UUID, target_role TEXT, metric_name TEXT)
RETURNS NUMERIC AS $$
DECLARE
  value NUMERIC := 0;
BEGIN
  IF target_user_id IS NULL THEN
    RETURN 0;
  END IF;

  IF target_role = 'provider' THEN
    CASE metric_name
      WHEN 'completed_jobs' THEN
        SELECT GREATEST(
          COALESCE((SELECT total_jobs FROM public.sellers WHERE id = target_user_id), 0),
          COALESCE(COUNT(*) FILTER (WHERE status IN ('completed', 'reviewed')), 0)
        )
        INTO value
        FROM public.eloo_bookings
        WHERE provider_id = target_user_id;
      WHEN 'average_rating' THEN
        SELECT COALESCE(AVG(rating), COALESCE((SELECT rating FROM public.sellers WHERE id = target_user_id), 0))
        INTO value
        FROM public.eloo_reviews
        WHERE reviewee_id = target_user_id;
      WHEN 'review_count' THEN
        SELECT COALESCE(COUNT(*), 0)
        INTO value
        FROM public.eloo_reviews
        WHERE reviewee_id = target_user_id;
      WHEN 'total_earnings' THEN
        SELECT COALESCE(SUM(CASE WHEN status IN ('completed', 'reviewed') THEN total_price ELSE 0 END), 0)
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
          COALESCE((SELECT COUNT(*) FROM public.service_inquiries WHERE user_id = target_user_id AND status IN ('accepted', 'bid_accepted', 'confirmed', 'in_progress', 'completed', 'converted')), 0),
          COALESCE((SELECT COUNT(*) FROM public.eloo_bookings WHERE client_id = target_user_id AND status IN ('confirmed', 'in_progress', 'completed', 'reviewed')), 0)
        )
        INTO value;
      WHEN 'paid_jobs' THEN
        SELECT COALESCE(COUNT(*), 0)
        INTO value
        FROM public.eloo_bookings
        WHERE client_id = target_user_id
          AND (is_paid = TRUE OR status IN ('confirmed', 'in_progress', 'completed', 'reviewed'));
      WHEN 'total_spent' THEN
        SELECT COALESCE(SUM(total_price), 0)
        INTO value
        FROM public.eloo_bookings
        WHERE client_id = target_user_id
          AND (is_paid = TRUE OR status IN ('confirmed', 'in_progress', 'completed', 'reviewed'));
      WHEN 'payment_verified' THEN
        SELECT CASE WHEN EXISTS (
          SELECT 1
          FROM public.eloo_bookings
          WHERE client_id = target_user_id
            AND (is_paid = TRUE OR status IN ('confirmed', 'in_progress', 'completed', 'reviewed'))
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_user_badges_for_user(target_user_id UUID, target_role TEXT)
RETURNS VOID AS $$
DECLARE
  badge RECORD;
  qualifies BOOLEAN;
  new_user_badge_id UUID;
BEGIN
  IF target_user_id IS NULL OR target_role NOT IN ('provider', 'buyer') THEN
    RETURN;
  END IF;

  FOR badge IN
    SELECT bd.id, bd.audience, bd.award_type
    FROM public.badge_definitions bd
    WHERE bd.is_active = TRUE
      AND bd.award_type IN ('automatic', 'system')
      AND bd.audience IN (target_role, 'all')
      AND EXISTS (SELECT 1 FROM public.badge_rules br WHERE br.badge_id = bd.id)
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_badges ub
        WHERE ub.user_id = target_user_id
          AND ub.badge_id = bd.id
          AND ub.target_role = target_role
      )
  LOOP
    SELECT BOOL_AND(
      CASE br.operator
        WHEN 'gte' THEN public.badge_metric_value(target_user_id, target_role, br.metric) >= br.threshold
        WHEN 'lte' THEN public.badge_metric_value(target_user_id, target_role, br.metric) <= br.threshold
        ELSE public.badge_metric_value(target_user_id, target_role, br.metric) = br.threshold
      END
    )
    INTO qualifies
    FROM public.badge_rules br
    WHERE br.badge_id = badge.id;

    IF qualifies THEN
      INSERT INTO public.user_badges (user_id, badge_id, target_role, award_type, awarded_reason, source)
      VALUES (target_user_id, badge.id, target_role, badge.award_type, 'Automatic rule requirements met', 'rule')
      ON CONFLICT (user_id, badge_id, target_role) DO NOTHING
      RETURNING id INTO new_user_badge_id;

      IF target_role = 'provider' THEN
        INSERT INTO public.provider_badges (provider_id, badge_id, awarded_reason)
        VALUES (target_user_id, badge.id, 'Automatic rule requirements met')
        ON CONFLICT (provider_id, badge_id) DO NOTHING;
      END IF;

      IF new_user_badge_id IS NOT NULL THEN
        INSERT INTO public.badge_award_events (user_badge_id, user_id, badge_id, target_role, event_type, reason, metadata)
        VALUES (new_user_badge_id, target_user_id, badge.id, target_role, 'awarded', 'Automatic rule requirements met', jsonb_build_object('source', 'rule'));
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_user_badges_from_booking()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.sync_user_badges_for_user(NEW.provider_id, 'provider');
  PERFORM public.sync_user_badges_for_user(NEW.client_id, 'buyer');
  IF TG_OP = 'UPDATE' THEN
    IF OLD.provider_id IS DISTINCT FROM NEW.provider_id THEN
      PERFORM public.sync_user_badges_for_user(OLD.provider_id, 'provider');
    END IF;
    IF OLD.client_id IS DISTINCT FROM NEW.client_id THEN
      PERFORM public.sync_user_badges_for_user(OLD.client_id, 'buyer');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_user_badges_from_service_inquiry()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.sync_user_badges_for_user(NEW.user_id, 'buyer');
  IF TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    PERFORM public.sync_user_badges_for_user(OLD.user_id, 'buyer');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_user_badges_from_review()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.sync_user_badges_for_user(NEW.reviewee_id, 'provider');
  PERFORM public.sync_user_badges_for_user(NEW.reviewer_id, 'buyer');
  IF TG_OP = 'UPDATE' THEN
    IF OLD.reviewee_id IS DISTINCT FROM NEW.reviewee_id THEN
      PERFORM public.sync_user_badges_for_user(OLD.reviewee_id, 'provider');
    END IF;
    IF OLD.reviewer_id IS DISTINCT FROM NEW.reviewer_id THEN
      PERFORM public.sync_user_badges_for_user(OLD.reviewer_id, 'buyer');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_user_badges_from_seller()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.sync_user_badges_for_user(NEW.id, 'provider');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_user_badges_from_buyer()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.sync_user_badges_for_user(NEW.id, 'buyer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_user_badges_on_booking ON public.eloo_bookings;
CREATE TRIGGER sync_user_badges_on_booking
  AFTER INSERT OR UPDATE OF provider_id, client_id, status, total_price, is_paid ON public.eloo_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_badges_from_booking();

DROP TRIGGER IF EXISTS sync_user_badges_on_service_inquiry ON public.service_inquiries;
CREATE TRIGGER sync_user_badges_on_service_inquiry
  AFTER INSERT OR UPDATE OF user_id, status ON public.service_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_badges_from_service_inquiry();

DROP TRIGGER IF EXISTS sync_user_badges_on_review ON public.eloo_reviews;
CREATE TRIGGER sync_user_badges_on_review
  AFTER INSERT OR UPDATE OF reviewee_id, reviewer_id, rating ON public.eloo_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_badges_from_review();

DROP TRIGGER IF EXISTS sync_user_badges_on_seller ON public.sellers;
CREATE TRIGGER sync_user_badges_on_seller
  AFTER INSERT OR UPDATE OF status, rating, total_jobs ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_badges_from_seller();

DROP TRIGGER IF EXISTS sync_user_badges_on_buyer ON public.buyers;
CREATE TRIGGER sync_user_badges_on_buyer
  AFTER INSERT OR UPDATE OF kyc_status ON public.buyers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_badges_from_buyer();

INSERT INTO public.badge_definitions (slug, name, description, icon, color, audience, award_type, is_active, is_public, sort_order)
VALUES
  ('payment-verified', 'Payment verified', 'Buyer has completed at least one paid AnyJob booking.', 'ShieldCheck', 'emerald', 'buyer', 'system', TRUE, TRUE, 10),
  ('verified-buyer', 'Verified buyer', 'Buyer has completed platform KYC.', 'CheckCircle', 'blue', 'buyer', 'system', TRUE, TRUE, 20),
  ('hired-before', 'Hired before', 'Buyer has accepted and hired a provider before.', 'ThumbsUp', 'purple', 'buyer', 'automatic', TRUE, TRUE, 30),
  ('trusted-client', 'Trusted client', 'Buyer has spent at least 500 through AnyJob.', 'Crown', 'amber', 'buyer', 'automatic', TRUE, TRUE, 40),
  ('five-jobs-completed', '5 jobs completed', 'Provider has completed at least five jobs.', 'Award', 'blue', 'provider', 'automatic', TRUE, TRUE, 50),
  ('top-rated-provider', 'Top rated provider', 'Provider has a high average rating and multiple reviews.', 'Star', 'amber', 'provider', 'automatic', TRUE, TRUE, 60)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  audience = EXCLUDED.audience,
  award_type = EXCLUDED.award_type,
  is_active = EXCLUDED.is_active,
  is_public = EXCLUDED.is_public,
  sort_order = EXCLUDED.sort_order;

WITH target AS (
  SELECT id AS badge_id, 'payment_verified'::text AS metric, 'gte'::text AS operator, 1::numeric AS threshold
  FROM public.badge_definitions WHERE slug = 'payment-verified'
)
INSERT INTO public.badge_rules (badge_id, metric, operator, threshold)
SELECT badge_id, metric, operator, threshold FROM target
WHERE NOT EXISTS (
  SELECT 1 FROM public.badge_rules br, target
  WHERE br.badge_id = target.badge_id AND br.metric = target.metric AND br.operator = target.operator AND br.threshold = target.threshold
);

WITH target AS (
  SELECT id AS badge_id, 'kyc_verified'::text AS metric, 'gte'::text AS operator, 1::numeric AS threshold
  FROM public.badge_definitions WHERE slug = 'verified-buyer'
)
INSERT INTO public.badge_rules (badge_id, metric, operator, threshold)
SELECT badge_id, metric, operator, threshold FROM target
WHERE NOT EXISTS (
  SELECT 1 FROM public.badge_rules br, target
  WHERE br.badge_id = target.badge_id AND br.metric = target.metric AND br.operator = target.operator AND br.threshold = target.threshold
);

WITH target AS (
  SELECT id AS badge_id, 'hired_jobs'::text AS metric, 'gte'::text AS operator, 1::numeric AS threshold
  FROM public.badge_definitions WHERE slug = 'hired-before'
)
INSERT INTO public.badge_rules (badge_id, metric, operator, threshold)
SELECT badge_id, metric, operator, threshold FROM target
WHERE NOT EXISTS (
  SELECT 1 FROM public.badge_rules br, target
  WHERE br.badge_id = target.badge_id AND br.metric = target.metric AND br.operator = target.operator AND br.threshold = target.threshold
);

WITH target AS (
  SELECT id AS badge_id, 'total_spent'::text AS metric, 'gte'::text AS operator, 500::numeric AS threshold
  FROM public.badge_definitions WHERE slug = 'trusted-client'
)
INSERT INTO public.badge_rules (badge_id, metric, operator, threshold)
SELECT badge_id, metric, operator, threshold FROM target
WHERE NOT EXISTS (
  SELECT 1 FROM public.badge_rules br, target
  WHERE br.badge_id = target.badge_id AND br.metric = target.metric AND br.operator = target.operator AND br.threshold = target.threshold
);

WITH target AS (
  SELECT id AS badge_id, 'completed_jobs'::text AS metric, 'gte'::text AS operator, 5::numeric AS threshold
  FROM public.badge_definitions WHERE slug = 'five-jobs-completed'
)
INSERT INTO public.badge_rules (badge_id, metric, operator, threshold)
SELECT badge_id, metric, operator, threshold FROM target
WHERE NOT EXISTS (
  SELECT 1 FROM public.badge_rules br, target
  WHERE br.badge_id = target.badge_id AND br.metric = target.metric AND br.operator = target.operator AND br.threshold = target.threshold
);

WITH target AS (
  SELECT id AS badge_id, 'average_rating'::text AS metric, 'gte'::text AS operator, 4.7::numeric AS threshold
  FROM public.badge_definitions WHERE slug = 'top-rated-provider'
)
INSERT INTO public.badge_rules (badge_id, metric, operator, threshold)
SELECT badge_id, metric, operator, threshold FROM target
WHERE NOT EXISTS (
  SELECT 1 FROM public.badge_rules br, target
  WHERE br.badge_id = target.badge_id AND br.metric = target.metric AND br.operator = target.operator AND br.threshold = target.threshold
);

WITH target AS (
  SELECT id AS badge_id, 'review_count'::text AS metric, 'gte'::text AS operator, 5::numeric AS threshold
  FROM public.badge_definitions WHERE slug = 'top-rated-provider'
)
INSERT INTO public.badge_rules (badge_id, metric, operator, threshold)
SELECT badge_id, metric, operator, threshold FROM target
WHERE NOT EXISTS (
  SELECT 1 FROM public.badge_rules br, target
  WHERE br.badge_id = target.badge_id AND br.metric = target.metric AND br.operator = target.operator AND br.threshold = target.threshold
);

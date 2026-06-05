-- Badge definitions and automatic provider awards.

CREATE TABLE IF NOT EXISTS public.badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'Award',
    color TEXT NOT NULL DEFAULT 'red',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.badge_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id UUID NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
    metric TEXT NOT NULL CHECK (metric IN (
        'completed_jobs',
        'average_rating',
        'review_count',
        'total_earnings',
        'cancelled_jobs',
        'verified_provider'
    )),
    operator TEXT NOT NULL CHECK (operator IN ('gte', 'lte', 'eq')),
    threshold NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.provider_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badge_definitions(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    awarded_reason TEXT,
    UNIQUE(provider_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_badge_definitions_active ON public.badge_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_badge_rules_badge_id ON public.badge_rules(badge_id);
CREATE INDEX IF NOT EXISTS idx_provider_badges_provider_id ON public.provider_badges(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_badges_badge_id ON public.provider_badges(badge_id);

ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active badge definitions"
    ON public.badge_definitions FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public can view active badge rules"
    ON public.badge_rules FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.badge_definitions bd
            WHERE bd.id = badge_rules.badge_id
              AND bd.is_active = TRUE
        )
    );

CREATE POLICY "Providers can view their own awarded badges"
    ON public.provider_badges FOR SELECT
    USING (auth.uid() = provider_id);

DROP TRIGGER IF EXISTS update_badge_definitions_updated_at ON public.badge_definitions;
CREATE TRIGGER update_badge_definitions_updated_at
    BEFORE UPDATE ON public.badge_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.sync_provider_badges_for_provider(target_provider_id UUID)
RETURNS VOID AS $$
DECLARE
    completed_jobs_value NUMERIC;
    average_rating_value NUMERIC;
    review_count_value NUMERIC;
    total_earnings_value NUMERIC;
    cancelled_jobs_value NUMERIC;
    verified_provider_value NUMERIC;
    badge RECORD;
BEGIN
    IF target_provider_id IS NULL THEN
        RETURN;
    END IF;

    SELECT
        GREATEST(
            COALESCE((SELECT total_jobs FROM public.sellers WHERE id = target_provider_id), 0),
            COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0)
        ),
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END), 0),
        COALESCE(COUNT(*) FILTER (WHERE status = 'cancelled'), 0)
    INTO completed_jobs_value, total_earnings_value, cancelled_jobs_value
    FROM public.eloo_bookings
    WHERE provider_id = target_provider_id;

    SELECT
        COALESCE(AVG(rating), COALESCE((SELECT rating FROM public.sellers WHERE id = target_provider_id), 0)),
        COALESCE(COUNT(*), 0)
    INTO average_rating_value, review_count_value
    FROM public.eloo_reviews
    WHERE reviewee_id = target_provider_id;

    SELECT CASE WHEN EXISTS (
        SELECT 1
        FROM public.sellers s
        WHERE s.id = target_provider_id
          AND s.status = 'approved'
    ) OR EXISTS (
        SELECT 1
        FROM public.eloo_profiles p
        WHERE p.id = target_provider_id
          AND p.is_verified = TRUE
    ) THEN 1 ELSE 0 END
    INTO verified_provider_value;

    FOR badge IN
        SELECT bd.id
        FROM public.badge_definitions bd
        WHERE bd.is_active = TRUE
          AND EXISTS (
              SELECT 1
              FROM public.badge_rules br
              WHERE br.badge_id = bd.id
          )
          AND NOT EXISTS (
              SELECT 1
              FROM public.provider_badges pb
              WHERE pb.provider_id = target_provider_id
                AND pb.badge_id = bd.id
          )
          AND (
              SELECT BOOL_AND(
                  CASE br.metric
                      WHEN 'completed_jobs' THEN
                          CASE br.operator
                              WHEN 'gte' THEN completed_jobs_value >= br.threshold
                              WHEN 'lte' THEN completed_jobs_value <= br.threshold
                              ELSE completed_jobs_value = br.threshold
                          END
                      WHEN 'average_rating' THEN
                          CASE br.operator
                              WHEN 'gte' THEN average_rating_value >= br.threshold
                              WHEN 'lte' THEN average_rating_value <= br.threshold
                              ELSE average_rating_value = br.threshold
                          END
                      WHEN 'review_count' THEN
                          CASE br.operator
                              WHEN 'gte' THEN review_count_value >= br.threshold
                              WHEN 'lte' THEN review_count_value <= br.threshold
                              ELSE review_count_value = br.threshold
                          END
                      WHEN 'total_earnings' THEN
                          CASE br.operator
                              WHEN 'gte' THEN total_earnings_value >= br.threshold
                              WHEN 'lte' THEN total_earnings_value <= br.threshold
                              ELSE total_earnings_value = br.threshold
                          END
                      WHEN 'cancelled_jobs' THEN
                          CASE br.operator
                              WHEN 'gte' THEN cancelled_jobs_value >= br.threshold
                              WHEN 'lte' THEN cancelled_jobs_value <= br.threshold
                              ELSE cancelled_jobs_value = br.threshold
                          END
                      WHEN 'verified_provider' THEN
                          CASE br.operator
                              WHEN 'gte' THEN verified_provider_value >= br.threshold
                              WHEN 'lte' THEN verified_provider_value <= br.threshold
                              ELSE verified_provider_value = br.threshold
                          END
                      ELSE FALSE
                  END
              )
              FROM public.badge_rules br
              WHERE br.badge_id = bd.id
          )
    LOOP
        INSERT INTO public.provider_badges (provider_id, badge_id, awarded_reason)
        VALUES (target_provider_id, badge.id, 'Automatic rule requirements met')
        ON CONFLICT (provider_id, badge_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_provider_badges_from_booking()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.sync_provider_badges_for_provider(NEW.provider_id);
    IF TG_OP = 'UPDATE' AND OLD.provider_id IS DISTINCT FROM NEW.provider_id THEN
        PERFORM public.sync_provider_badges_for_provider(OLD.provider_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_provider_badges_from_review()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.sync_provider_badges_for_provider(NEW.reviewee_id);
    IF TG_OP = 'UPDATE' AND OLD.reviewee_id IS DISTINCT FROM NEW.reviewee_id THEN
        PERFORM public.sync_provider_badges_for_provider(OLD.reviewee_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_provider_badges_from_seller()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.sync_provider_badges_for_provider(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_provider_badges_on_booking ON public.eloo_bookings;
CREATE TRIGGER sync_provider_badges_on_booking
    AFTER INSERT OR UPDATE OF provider_id, status, total_price ON public.eloo_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_provider_badges_from_booking();

DROP TRIGGER IF EXISTS sync_provider_badges_on_review ON public.eloo_reviews;
CREATE TRIGGER sync_provider_badges_on_review
    AFTER INSERT OR UPDATE OF reviewee_id, rating ON public.eloo_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_provider_badges_from_review();

DROP TRIGGER IF EXISTS sync_provider_badges_on_seller ON public.sellers;
CREATE TRIGGER sync_provider_badges_on_seller
    AFTER INSERT OR UPDATE OF status, rating, total_jobs ON public.sellers
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_provider_badges_from_seller();

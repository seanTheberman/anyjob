-- Keep AnyJob launch data constrained to Ireland until additional markets open.
DO $$
BEGIN
  IF to_regclass('public.buyers') IS NOT NULL THEN
    ALTER TABLE public.buyers ALTER COLUMN country SET DEFAULT 'Ireland';
    UPDATE public.buyers
      SET country = 'Ireland'
      WHERE country IS NULL OR country <> 'Ireland';
  END IF;

  IF to_regclass('public.sellers') IS NOT NULL THEN
    ALTER TABLE public.sellers ALTER COLUMN country SET DEFAULT 'Ireland';
    UPDATE public.sellers
      SET country = 'Ireland'
      WHERE country IS NULL OR country <> 'Ireland';
  END IF;

  IF to_regclass('public.business_profiles') IS NOT NULL THEN
    ALTER TABLE public.business_profiles ALTER COLUMN country SET DEFAULT 'Ireland';
    UPDATE public.business_profiles
      SET country = 'Ireland'
      WHERE country IS NULL OR country <> 'Ireland';
  END IF;

  IF to_regclass('public.shift_market_rates') IS NOT NULL THEN
    ALTER TABLE public.shift_market_rates ALTER COLUMN country SET DEFAULT 'Ireland';
    UPDATE public.shift_market_rates
      SET country = 'Ireland'
      WHERE country <> 'Ireland' AND source = 'AnyJob launch estimate';
  END IF;
END $$;

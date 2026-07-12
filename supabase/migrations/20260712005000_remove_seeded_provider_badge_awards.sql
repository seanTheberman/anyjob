-- Seeded marketplace badge awards were only for early UI verification.
-- They should not appear as earned public trust badges.

DELETE FROM public.provider_badges
WHERE awarded_reason ILIKE 'Seeded marketplace data for Supabase-backed UI verification%';

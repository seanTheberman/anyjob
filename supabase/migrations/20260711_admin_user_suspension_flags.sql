ALTER TABLE public.eloo_profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.buyers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.admin_user_flags (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'watchlisted', 'blocked')),
  risk_override TEXT
    CHECK (risk_override IS NULL OR risk_override IN ('Low', 'Medium', 'High')),
  note TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_user_flags_status
  ON public.admin_user_flags(status);

CREATE INDEX IF NOT EXISTS idx_admin_user_flags_risk_override
  ON public.admin_user_flags(risk_override);

ALTER TABLE public.admin_user_flags ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_admin_user_flags_updated_at ON public.admin_user_flags;
CREATE TRIGGER update_admin_user_flags_updated_at
  BEFORE UPDATE ON public.admin_user_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

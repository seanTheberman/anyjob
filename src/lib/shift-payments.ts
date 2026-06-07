type ShiftPostForAmount = {
  work_type?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  business_preferred_hourly_rate?: number | string | null;
  business_preferred_day_rate?: number | string | null;
};

type ShiftApplicationForAmount = {
  proposed_hourly_rate?: number | string | null;
  proposed_day_rate?: number | string | null;
};

function numeric(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function calculateShiftHours(post: ShiftPostForAmount) {
  if (!post.starts_at || !post.ends_at) return 1;
  const start = new Date(post.starts_at).getTime();
  const end = new Date(post.ends_at).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return Math.max(1, Math.round(((end - start) / 36_000) / 10));
}

export function calculateShiftAgreedAmount(post: ShiftPostForAmount, application: ShiftApplicationForAmount) {
  const dayRate = numeric(application.proposed_day_rate) ?? numeric(post.business_preferred_day_rate);
  if (dayRate) return dayRate;

  const hourlyRate = numeric(application.proposed_hourly_rate) ?? numeric(post.business_preferred_hourly_rate) ?? 1;
  return Math.round(hourlyRate * calculateShiftHours(post) * 100) / 100;
}
